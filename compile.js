class Compiler{
  constructor(el,vm){
    this.$el = document.querySelector(el);
    this.$vm = vm;
    if(this.$el){
      this.$fragment = this.node2fragment();//提取出片段，再进行编译，减少dom消耗
      this.compile(this.$fragment);
      this.$el.appendChild(this.$fragment);//编译好的片段，最后插入到html中
    }
  }
  node2fragment(){
    //分片
    let fragment = document.createDocumentFragment();
    //依次移走
    while(this.$el.firstChild){
      fragment.appendChild(this.$el.firstChild);
    }
    return fragment;
  }
  compile(el){
    Array.from(el.childNodes).forEach((node)=>{
      this.compileAttributeNode(node);
      //内容解析，插值等表达式
      this.compileCValueNode(node);
      this.compile(node);//递归子节点
    });
  }
  compileAttributeNode(node){
  // 属性节点
    let attrs = node.attributes;
    if(!attrs) return;
    Array.from(attrs).forEach((attr)=>{
      let attrName = attr.name;
      if(!attrName) return;
      let directiveName;
      let attrValue = attr.value;
      if(directiveName = this.isDirectives(attrName)){//解析出指令名称 x-text or :text = >text
        this.update(node,attrValue,directiveName);
      }else if(this.isEvent(attrName)){
        this.eventHandler(node,attrName,attrValue);
      }
    });
  }
  update(node,exp,type){
    const updaterFn = this[type+'Updater'];
    if(!updaterFn){
      //throw new Error(`没有找到${type}类型的更新器`);
    }
    updaterFn && updaterFn(node,this.$vm[exp]);

    //类似v-model的实现，只支持input
    if(type === 'model'){
      node.addEventListener('input', (event)=>{
        this.$vm[exp] = event.target.value;
      });
    }

    //很关键的watcher,在数据发生变化后会调用参数3：回调函数，从而触发更新操作
    new Watcher(exp,this.$vm,function () {
      updaterFn && updaterFn(node,this[exp]);
    });
  }
  textUpdater(node,value){
    node.textContent = value;
  }
  htmlUpdater(node,value){
    node.innerHTML = value;
  }
  modelUpdater(node,value){
    node.value = value;
  }
  isDirectives(attrName){
    if(attrName.indexOf('x-') === 0) return attrName.substring(2);//解析x-开头的
    if(attrName.indexOf(':') === 0) return attrName.substring(1);//解析:开头的
  }
  //@开头的事件解析
  isEvent(attrName){
    return attrName.startsWith('@');
  }
  eventHandler(node,attrName,eventHandler){
    let eventName = attrName.substring(1);
    let fn = this.$vm.$methods && this.$vm.$methods[eventHandler];
    node.addEventListener(eventName,fn.bind(this.$vm));
  }
  compileCValueNode(node){
    let value = node.textContent || node.innerHTML;
    if(value && !node.hasChildNodes()){
      if(/\{\{((?:.|\r?\n)+?)\}\}/g.test(value)){//插值表达式匹配,只支持一个表达式
        let key = RegExp.$1;//匹配到的结果
        if(node.nodeType === 3){
          this.update(node,key,'text');
        }else if(node.nodeType === 1){
          this.update(node,key,'html');
        }
      }
    }
  }
}


