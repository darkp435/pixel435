class ListNode {
    constructor(public value: any, public next = null) { }
}

export class Queue {
    constructor(private head: any = null, private tail: any = null) { }

    enqueue(item: any) {
        const node = new ListNode(item);
        if (!this.tail) {
            this.head = this.tail = node;
        }
    }
}