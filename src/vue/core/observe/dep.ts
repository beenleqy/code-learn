interface Target {
    [propName: string]: any;
}
let uid = 0;
class Dep {
    public id: number;
    public subs: any[] = [];
    static target : Target | null = null;

    constructor(){
        this.id = uid++;
        this.subs = []
    }

    addSubs(dep){
        this.subs.push(dep)
    }

    notify(){

        this.subs.forEach(watcher => {
            watcher.update()
        })

    }

    depend(){
        if(Dep.target){
            // console.log(this, '======depend=')
            Dep.target.addDep(this)
        }
    }
}

let stack: any[] = []
export function pushTarget(watcher) {
    Dep.target = watcher
    stack.push(watcher)
}

export function popTarget() {
    stack.pop()
    Dep.target = stack[stack.length - 1]
}

export default Dep;
