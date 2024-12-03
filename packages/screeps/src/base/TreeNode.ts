/**
 * 所有带有逻辑的对象的基类
 */
export class TreeNode {
    private parent?: TreeNode;
    private children: Record<string, TreeNode> = {};
    private dead = false;

    constructor(readonly name: string) {}

    tick() {
        if (this.dead) {
            this.kill();
        }

        for (const name in this.children) {
            this.children[name].tick();
        }
    }

    onDeath() {
        for (const name in this.children) {
            this.children[name].onDeath();
        }
    }

    kill() {
        this.onDeath();
        delete this.parent?.children[this.name];
    }

    killLater() {
        this.dead = true;
    }

    registerChild<T extends TreeNode>(child: T) {
        this.children[child.name] = child;
        return child;
    }
}
