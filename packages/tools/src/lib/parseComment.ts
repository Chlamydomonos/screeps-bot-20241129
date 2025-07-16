import * as ts from 'typescript';

interface Tag {
    name: string;
    data: string[];
}

export const parseComment = (fullText: string, node: ts.Node) => {
    const comment = fullText.substring(node.getFullStart(), node.getStart());
    const lines = comment.split('\n');
    const tags: Tag[] = [];
    for (const line of lines) {
        const match = /^\s*(?:\/\/|\*)?\s*#(\w+)(\s+.+?)?\s*$/g.exec(line);
        if (match) {
            const name = match[1];
            const data = match[2]?.match(/("([^"]*)")|(\S+)/g) ?? [];
            tags.push({ name, data });
        }
    }
    return tags;
};
