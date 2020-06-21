import { remove } from '../util'
let uid = 0;
class Dep {
    public id: number;
    public subs: any[] = [];
    static target : A_object | null = null;

    constructor(){
        this.id = uid++;
        this.subs = []
    }

    addSubs(dep){
        this.subs.push(dep)
        let t_subs: any[] = []
        this.subs.forEach(val => {
            t_subs.push({...val})
        })
        // vm._$subs =
        console.log(this.subs, '=========this.subs===========')
    }

    removeSub (sub) {
        remove(this.subs, sub)
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
