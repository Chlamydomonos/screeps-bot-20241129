import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { SCREEPS_SRC_PATH } from './paths';
import { clearItemOfFile } from './clearItemOfFile';
import { ClassMeta } from './db/models/ClassMeta';
import { parseComment } from './parseComment';
import { ClassTag } from './db/models/ClassTag';
import { ClassTagData } from './db/models/ClassTagData';
import { MethodMeta } from './db/models/MethodMeta';
import { MethodTag } from './db/models/MethodTag';
import { MethodTagData } from './db/models/MethodTagData';
import { GlobalStatement } from './db/models/GlobalStatement';
import { GlobalStatementTag } from './db/models/GlobalStatementTag';
import { GlobalStatementTagData } from './db/models/GlobalStatementTagData';
import { getDBPath } from './getDBPath';

interface ImportItem {
    name: string;
    realName: string;
    file: string;
}

interface ClassItem {
    name: string;
    id: number;
}

const handleImport = (
    absolutePath: string,
    importTable: Record<string, ImportItem>,
    importDecl: ts.ImportDeclaration
) => {
    const rawPathNode = importDecl.moduleSpecifier;
    if (rawPathNode.kind != ts.SyntaxKind.StringLiteral) {
        return;
    }

    const rawPath = (rawPathNode as ts.StringLiteral).text;
    if (!rawPath.includes('/') && !rawPath.includes('\\')) {
        return;
    }

    const selfPath = path.dirname(absolutePath);
    const filePath = path.resolve(selfPath, rawPath.replace('@', SCREEPS_SRC_PATH));
    const relativePath = path.relative(SCREEPS_SRC_PATH, filePath);

    const importClause = importDecl.importClause;
    if (!importClause) {
        return;
    }

    if (importClause.name) {
        const name = importClause.name.getText();
        importTable[name] = {
            name,
            file: relativePath,
            realName: '#default',
        };
    }

    if (importClause.namedBindings) {
        if (importClause.namedBindings.kind == ts.SyntaxKind.NamedImports) {
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

const createClass = async (
    importTable: Record<string, ImportItem>,
    file: string,
    classTable: Record<string, ClassItem>,
    name: string,
    parentName?: string,
    parentNamespace?: string
) => {
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

const handleMethod = async (content: string, classId: number, methodDecl: ts.MethodDeclaration) => {
    if (!methodDecl.body) {
        return;
    }

    const name = methodDecl.name.getText();
    const method = await MethodMeta.create({ name, classId });
    const tags = parseComment(content, methodDecl);
    const promises: Promise<any>[] = [];
    for (const tag of tags) {
        const methodTag = await MethodTag.create({
            name: tag.name,
            methodId: method.id,
        });
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

const handleClass = async (
    content: string,
    importTable: Record<string, ImportItem>,
    file: string,
    classTable: Record<string, ClassItem>,
    classDecl: ts.ClassDeclaration
) => {
    let isDefault = false;
    if (classDecl.modifiers) {
        for (const modifier of classDecl.modifiers) {
            if (modifier.kind == ts.SyntaxKind.DefaultKeyword) {
                isDefault = true;
            }
        }
    }

    if (!isDefault && !classDecl.name) {
        return;
    }

    const className = isDefault ? '#default' : classDecl.name!.getText();

    let parentName: string | undefined;
    let parentNamespace: string | undefined;
    if (classDecl.heritageClauses) {
        for (const clause of classDecl.heritageClauses) {
            if (clause.token == ts.SyntaxKind.ExtendsKeyword) {
                const exp = clause.types[0].expression;
                if (exp.kind == ts.SyntaxKind.Identifier) {
                    parentName = (exp as ts.Identifier).getText();
                } else if (exp.kind == ts.SyntaxKind.PropertyAccessExpression) {
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

    const tags = parseComment(content, classDecl);
    const promises: Promise<any>[] = [];
    for (const tag of tags) {
        const classTag = await ClassTag.create({
            name: tag.name,
            classId: created.id,
        });
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

    for (const member of classDecl.members) {
        if (member.kind == ts.SyntaxKind.MethodDeclaration) {
            promises.push(handleMethod(content, created.id, member as ts.MethodDeclaration));
        }
    }

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

const handleGlobalStatement = async (content: string, file: string, globalStatement: ts.Node) => {
    const tags = parseComment(content, globalStatement);
    if (tags.length == 0) {
        return;
    }

    const statement = await GlobalStatement.create({
        file,
        text: globalStatement.getText(),
    });

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

export const analyzeFile = async (fileName: string) => {
    const absolutePath = path.resolve(fileName);
    const relativePath = getDBPath(absolutePath);

    await clearItemOfFile(relativePath);

    const content = fs.readFileSync(absolutePath).toString();
    const source = ts.createSourceFile('temp.ts', content, ts.ScriptTarget.Latest, true);

    const importTable: Record<string, ImportItem> = {};
    const classTable: Record<string, ClassItem> = {};

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
