class XVue{
  constructor(options){
    this.$data = options.data || {};
    this.$methods = options.methods;
    this.observe(this.$data);
    new Compiler(options.el,this);
    options.created && options.created.call(this);
  }
  observe(data,deep){
    Object.keys(data).forEach((key)=>{
        //没个属性都需要劫持
      this.defineReactive(data,key,data[key]);
      //代理到this上面 this.$data[key] => this.key
      !deep && this.defineProxyProperty(key);//只有最外层需要挂载
    });
  }
  defineReactive(obj,key,value){
    if(typeof value === 'object'){
      this.observe(value,true);//递归
    }else{
      let dep = new Dep();//依赖收集
      Object.defineProperty(obj,key,{
        get:function () {
          //读取属性时，
          if(Dep.target){
            dep.addWather(Dep.target);
          }
          return value;
        },
        set:function (newValue) {
          if(value !== newValue){
            value = newValue;
          }
          dep.notify();
        }
      });
    }
  }
  defineProxyProperty(key){
    Object.defineProperty(this,key,{
      get:function () {
        return this.$data[key];
      },
      set:function (newValue) {
        this.$data[key] = newValue;
      }
    });
  }
}

class Dep{
  constructor(){
    this.watchers = [];
  }
  addWather(watcher){
    this.watchers.push(watcher);
  }
  notify(){
    this.watchers.forEach(watcher=>watcher.update());
  }
}

class Watcher{
  constructor(exp,vm,cb){
    this.exp = exp;
    this.vm = vm;
    this.cb = cb;
    Dep.target = this;
    this.vm[this.exp];//触发exp 的getter方法
    Dep.target = null;
  }
  update(){
    this.cb && this.cb.call(this.vm);
  }
}