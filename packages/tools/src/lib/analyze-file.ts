/**
 * TypeScript文件分析模块
 *
 * 这个模块负责分析TypeScript源文件，提取以下信息：
 * 1. 类的定义信息（类名、继承关系、标签）
 * 2. 方法的定义信息（方法名、所属类、标签）
 * 3. 全局语句的信息（语句内容、标签）
 * 4. 导入语句的解析（用于确定类的继承关系）
 *
 * 主要功能：
 * - 解析TypeScript AST获取代码结构信息
 * - 提取注释中的标签信息
 * - 维护类的继承关系链
 * - 将分析结果存储到数据库中
 */

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { SCREEPS_SRC_PATH } from './paths';
import { clearItemOfFile } from './clear-item-of-file';
import { ClassMeta } from './db/models/class-meta';
import { parseComment } from './parse-comment';
import { ClassTag } from './db/models/class-tag';
import { ClassTagData } from './db/models/class-tag-data';
import { MethodMeta } from './db/models/method-meta';
import { MethodTag } from './db/models/method-tag';
import { MethodTagData } from './db/models/method-tag-data';
import { GlobalStatement } from './db/models/global-statement';
import { GlobalStatementTag } from './db/models/global-statement-tag';
import { GlobalStatementTagData } from './db/models/global-statement-tag-data';
import { getDBPath } from './get-db-path';

/**
 * 导入项信息接口
 */
interface ImportItem {
    name: string; // 本地使用的名称
    realName: string; // 实际导出的名称
    file: string; // 来源文件路径
}

/**
 * 类项信息接口
 */
interface ClassItem {
    name: string; // 类名
    id: number; // 数据库ID
}

/**
 * 处理导入声明，构建导入表
 *
 * 解析import语句，提取导入的模块信息，包括：
 * - 默认导入：import Foo from './foo'
 * - 命名导入：import { Foo, Bar } from './foo'
 * - 命名空间导入：import * as Foo from './foo'
 *
 * @param absolutePath 当前文件的绝对路径
 * @param importTable 导入信息表
 * @param importDecl 导入声明AST节点
 */
const handleImport = (
    absolutePath: string,
    importTable: Record<string, ImportItem>,
    importDecl: ts.ImportDeclaration
) => {
    // 获取模块路径
    const rawPathNode = importDecl.moduleSpecifier;
    if (rawPathNode.kind != ts.SyntaxKind.StringLiteral) {
        return;
    }

    const rawPath = (rawPathNode as ts.StringLiteral).text;
    // 只处理相对路径导入
    if (!rawPath.includes('/') && !rawPath.includes('\\')) {
        return;
    }

    // 计算导入文件的实际路径
    const selfPath = path.dirname(absolutePath);
    const filePath = path.resolve(selfPath, rawPath.replace('@', SCREEPS_SRC_PATH));
    const relativePath = path.relative(SCREEPS_SRC_PATH, filePath);

    const importClause = importDecl.importClause;
    if (!importClause) {
        return;
    }

    // 处理默认导入
    if (importClause.name) {
        const name = importClause.name.getText();
        importTable[name] = {
            name,
            file: relativePath,
            realName: '#default',
        };
    }

    // 处理命名导入和命名空间导入
    if (importClause.namedBindings) {
        if (importClause.namedBindings.kind == ts.SyntaxKind.NamedImports) {
            // 命名导入：import { Foo, Bar as Baz } from './foo'
            const namedImports = importClause.namedBindings as ts.NamedImports;
            for (const item of namedImports.elements) {
                const name = item.name.getText();
                importTable[name] = {
                    name,
                    file: relativePath,
                    realName: item.propertyName ? item.propertyName.getText() : item.name.getText(),
                };
            }
        } else if (importClause.namedBindings.kind == ts.SyntaxKind.NamespaceImport) {
            // 命名空间导入：import * as Foo from './foo'
            const namespaceImport = importClause.namedBindings as ts.NamespaceImport;
            const name = namespaceImport.name.getText();
            importTable[name] = {
                name,
                file: relativePath,
                realName: '*',
            };
        }
    }
};

/**
 * 创建类元数据记录
 *
 * 在数据库中创建一个类的元数据记录，包含类名、文件路径和继承关系。
 * 支持处理不同的继承情况：
 * - 无继承
 * - 继承自同文件中的类
 * - 继承自其他文件中的类
 * - 继承自命名空间中的类
 *
 * @param importTable 导入信息表
 * @param file 当前文件路径
 * @param classTable 当前文件中的类信息表
 * @param name 类名
 * @param parentName 父类名（可选）
 * @param parentNamespace 父类所在的命名空间（可选）
 * @returns 创建的ClassMeta实例或undefined
 */
const createClass = async (
    importTable: Record<string, ImportItem>,
    file: string,
    classTable: Record<string, ClassItem>,
    name: string,
    parentName?: string,
    parentNamespace?: string
) => {
    // 检查是否已存在同名类
    const existing = await ClassMeta.findOne({
        where: {
            file,
            name,
        },
    });
    if (existing) {
        return undefined;
    }

    if (parentNamespace) {
        if (parentNamespace in importTable) {
            const parentFile = importTable[parentNamespace].file;
            const parent = await ClassMeta.findOne({
                where: {
                    file: parentFile,
                    name: parentName,
                },
            });
            if (parent) {
                return await ClassMeta.create({
                    file,
                    name,
                    parentId: parent.id,
                    parentUnknown: false,
                });
            } else {
                return await ClassMeta.create({
                    file,
                    name,
                    parentUnknown: true,
                    expectedParent: parentName,
                    expectedParentFile: parentFile,
                });
            }
        }
    } else if (parentName) {
        if (parentName in classTable) {
            return await ClassMeta.create({
                file,
                name,
                parentId: classTable[parentName].id,
                parentUnknown: false,
            });
        } else if (parentName in importTable) {
            const { file: parentFile, realName: parentRealName } = importTable[parentName];
            const parent = await ClassMeta.findOne({
                where: {
                    file: parentFile,
                    name: parentRealName,
                },
            });
            if (parent) {
                return await ClassMeta.create({
                    file,
                    name,
                    parentId: parent.id,
                    parentUnknown: false,
                });
            } else {
                return await ClassMeta.create({
                    file,
                    name,
                    parentUnknown: true,
                    expectedParent: parentRealName,
                    expectedParentFile: parentFile,
                });
            }
        } else {
            return await ClassMeta.create({
                name,
                file,
                parentUnknown: true,
                expectedParent: parentName,
            });
        }
    } else {
        return await ClassMeta.create({
            name,
            file,
            parentUnknown: false,
        });
    }
};

/**
 * 处理方法声明
 *
 * 解析类中的方法声明，提取方法信息和标签，存储到数据库中。
 *
 * @param content 源代码文本
 * @param classId 所属类的数据库ID
 * @param methodDecl 方法声明AST节点
 */
const handleMethod = async (content: string, classId: number, methodDecl: ts.MethodDeclaration) => {
    // 只处理有方法体的方法
    if (!methodDecl.body) {
        return;
    }

    // 创建方法记录
    const name = methodDecl.name.getText();
    const method = await MethodMeta.create({ name, classId });

    // 解析方法的标签
    const tags = parseComment(content, methodDecl);
    const promises: Promise<any>[] = [];
    for (const tag of tags) {
        const methodTag = await MethodTag.create({
            name: tag.name,
            methodId: method.id,
        });
        // 存储标签数据
        for (let i = 0; i < tag.data.length; i++) {
            const data = tag.data[i];
            promises.push(
                MethodTagData.create({
                    index: i,
                    value: data,
                    tagId: methodTag.id,
                })
            );
        }
    }
    await Promise.all(promises);
};

/**
 * 处理类声明
 *
 * 解析类声明，提取类信息、继承关系和方法，存储到数据库中。
 *
 * @param content 源代码文本
 * @param importTable 导入信息表
 * @param file 当前文件路径
 * @param classTable 当前文件中的类信息表
 * @param classDecl 类声明AST节点
 */
const handleClass = async (
    content: string,
    importTable: Record<string, ImportItem>,
    file: string,
    classTable: Record<string, ClassItem>,
    classDecl: ts.ClassDeclaration
) => {
    // 检查是否为默认导出
    let isDefault = false;
    if (classDecl.modifiers) {
        for (const modifier of classDecl.modifiers) {
            if (modifier.kind == ts.SyntaxKind.DefaultKeyword) {
                isDefault = true;
            }
        }
    }

    // 必须有名称或者是默认导出
    if (!isDefault && !classDecl.name) {
        return;
    }

    const className = isDefault ? '#default' : classDecl.name!.getText();

    // 解析继承关系
    let parentName: string | undefined;
    let parentNamespace: string | undefined;
    if (classDecl.heritageClauses) {
        for (const clause of classDecl.heritageClauses) {
            if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
                const exp = clause.types[0].expression;
                if (exp.kind == ts.SyntaxKind.Identifier) {
                    // 简单继承：class A extends B
                    parentName = (exp as ts.Identifier).getText();
                } else if (exp.kind == ts.SyntaxKind.PropertyAccessExpression) {
                    // 命名空间继承：class A extends Namespace.B
                    const namespaceExp = exp as ts.PropertyAccessExpression;
                    if (
                        namespaceExp.expression.kind == ts.SyntaxKind.Identifier &&
                        namespaceExp.name.kind == ts.SyntaxKind.Identifier
                    ) {
                        parentName = (namespaceExp.name as ts.Identifier).getText();
                        parentNamespace = (namespaceExp.expression as ts.Identifier).getText();
                    }
                }
            }
        }
    }

    const created = await createClass(importTable, file, classTable, className, parentName, parentNamespace);
    if (!created) {
        return;
    }

    classTable[className] = {
        id: created.id,
        name: created.name,
    };

    // 解析类的标签
    const tags = parseComment(content, classDecl);
    const promises: Promise<any>[] = [];
    for (const tag of tags) {
        const classTag = await ClassTag.create({
            name: tag.name,
            classId: created.id,
        });
        // 存储标签数据
        for (let i = 0; i < tag.data.length; i++) {
            const data = tag.data[i];
            promises.push(
                ClassTagData.create({
                    index: i,
                    value: data,
                    tagId: classTag.id,
                })
            );
        }
    }

    // 处理类的所有方法
    for (const member of classDecl.members) {
        if (member.kind == ts.SyntaxKind.MethodDeclaration) {
            promises.push(handleMethod(content, created.id, member as ts.MethodDeclaration));
        }
    }

    // 更新等待当前类的子类，将它们的父类设置为当前类
    promises.push(
        ClassMeta.update(
            {
                parentId: created.id,
                parentUnknown: false,
            },
            {
                where: {
                    parentUnknown: true,
                    expectedParent: className,
                    expectedParentFile: file,
                },
            }
        )
    );

    await Promise.all(promises);
};

/**
 * 处理全局语句
 *
 * 解析全局作用域中的语句，提取带有标签的语句信息。
 *
 * @param content 源代码文本
 * @param file 当前文件路径
 * @param globalStatement 全局语句AST节点
 */
const handleGlobalStatement = async (content: string, file: string, globalStatement: ts.Node) => {
    const tags = parseComment(content, globalStatement);
    if (tags.length == 0) {
        return;
    }

    // 创建全局语句记录
    const statement = await GlobalStatement.create({
        file,
        text: globalStatement.getText(),
    });

    // 存储标签信息
    const promises: Promise<any>[] = [];
    for (const tag of tags) {
        const globalStatementTag = await GlobalStatementTag.create({
            name: tag.name,
            globalStatementId: statement.id,
        });
        for (let i = 0; i < tag.data.length; i++) {
            const data = tag.data[i];
            promises.push(
                GlobalStatementTagData.create({
                    index: i,
                    value: data,
                    tagId: globalStatementTag.id,
                })
            );
        }
    }
    await Promise.all(promises);
};

/**
 * 分析TypeScript文件
 *
 * 这是模块的主要导出函数，负责分析单个TypeScript文件的内容。
 *
 * 处理流程：
 * 1. 清理数据库中该文件的旧记录
 * 2. 解析TypeScript AST
 * 3. 处理导入语句
 * 4. 处理类声明
 * 5. 处理全局语句
 *
 * @param fileName 要分析的文件名（绝对路径）
 * @returns 文件的相对路径
 */
export const analyzeFile = async (fileName: string) => {
    const absolutePath = path.resolve(fileName);
    const relativePath = getDBPath(absolutePath);

    // 清理该文件的旧记录
    await clearItemOfFile(relativePath);

    // 读取并解析文件
    const content = fs.readFileSync(absolutePath).toString();
    const source = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);

    const importTable: Record<string, ImportItem> = {};
    const classTable: Record<string, ClassItem> = {};

    // 处理所有顶层语句
    for (const node of source.statements) {
        if (node.kind == ts.SyntaxKind.ImportDeclaration) {
            handleImport(absolutePath, importTable, node as ts.ImportDeclaration);
        } else if (node.kind == ts.SyntaxKind.ClassDeclaration) {
            await handleClass(content, importTable, relativePath, classTable, node as ts.ClassDeclaration);
        } else {
            await handleGlobalStatement(content, relativePath, node);
        }
    }

    return relativePath;
};
