### MVVM迷你型脚本的使用说明

面对当前多种多样的MVVM的实现，在这里只是简单实现了一个数据绑定的脚本，在营销工具的业务场景中会有比较好的体现，`write less do more`

#### 浏览器支持情况：

理论上支持 IE8+，Chrome、Firefox ...

#### 它能做的事情：

0. 给定一个数据对象，在数据修改之后，能够自动刷新View
0. 支持异步接口的情况。在异步接口改变之后，可以重新发起请求，然后更新View

#### 它的API

* `create` (静态方法)，生成一个模块实例化组件

```javascript
var Component = MVM.create({
	container : "articleList",
	template : ArticleListTpl,
	data : { list : [
		{ ... }
	]}
});

```

* `config`：实例化组件的配置

```javascript
var Component = MVM.create();
Component.config({
	container : "articleList",
	template : ArticleListTpl,
	data : { list : [
		{ ... }
	]}
});
```

配置项如下所列：（后面会有详细的DEMO说明）

* container：[css selector | DOM Element] 模板渲染的目标容器
* template：[juicer模板模块对象] juicer模板对象
* async：[true | false] 是否异步的方式，监控URL API的变化进行数据更新和View更新操作
* data：[object] 数据对象
* before：[function] 可以对原始数据进行一些特殊处理，参数就是原始的数据
* render：[function] 自定义的render函数，参数就是data字段的数据
* initProps ：[function] 声明一些属性，在组件对象生命周期内可以使用
* setProps：[function] 设置属性的值进行修改，也可以对一个没有init的props进行set
* didCreated：[function] 事件函数，在组件创建后调用
* beforeChange：[function] 事件函数，在数据发生改变之前调用，参数就是改变之前的数据
* afterChange：[function] 事件函数，在数据发生改变之后调用，参数就是改变之后的数据

详细的使用方式，可以查看sample目录的demo文件


* `initData`：实例化组件的初始化数据。如果在config或者create中都没有传入data字段，那么可以通过这个接口来添加数据

```javascript

//如果此时没有添加data字段，那么无法监控数据变化，以及渲染View
var Component = MVM.create();
Component.config({
	container : "articleList",
	template : ArticleListTpl
});

//通过调用initData方法来添加初始化的数据，并且对数据进行监控、渲染View
Component.initData({
	list : [ ... ]
});

```

* `getData`：实例化组件的方法，获取当前的数据

```javascript
var Component = MVM.create( ... );
var data = Component.getData();
```

* `setData`：实例化组件的方法，手动设置数据，触发数据的变化，更新View

```javascript
var Component = MVM.create( ... );
Component.initData({
	success : true,
	model : {
		list : [
			{ ... },
			{ ... }
		]
	}
});

//可以通过setData方法手动修改数据的变更
//注意第一个参数的形式，支持多层级嵌套的数据修改
Component.setData("model.list", [
	{ ... }
]);

```


#### 现在来主要讲讲它的应用场景，通过Sample代码来讲解一下

* 非异步的情况，给定一个数据对象，然后根据页面交互修改数据对象内容，触发View的更新。

```html
<!-- HTML -->
<articleList></articleList>
```

```html
<!-- Template：articleListTpl.juicer -->

{@if model.list.length > 0}
    <ul>
        {@each model.list as item, index}
             <li>
             	<a href='${item.url}'>${item.title}</a>
             	<div>${item.desc} -- <span style="color:#999;">${item.date}</span></div>
             </li>
        {@/each}
    </ul>
{@/if}

```

```javascript

KISSY.use(['./mvm', './articleListTpl', 'dom'], function(S, MVM, ArticleListTpl, DOM){
	
	var Component = MVM.create({
		container : "articleList",
		template : ArticleListTpl,
		data : {
			model : {
				list : [ { "title" : "xxxxx111", "url" : "http://example.com", "desc" : "sdfsdfdsf", "date" : "2015-3-31" } ]
			}
		}
	});

	setTimeout(function(){
		Component.setData("model.list", [
			[ 
				{ "title" : "xxxxx111", "url" : "http://example.com", "desc" : "sdfsdfdsf", "date" : "2015-3-31" },
				{ "title" : "xxxxx222", "url" : "http://example.com", "desc" : "sdfsdfdsf", "date" : "2015-3-31" }
			]
		]);
	}, 2000);

});

```

* 异步操作的情况，监控页面某个异步API URL的变化重新请求数据，然后更新View

```html
<!-- HTML -->
<articleList></articleList>
```

```html
<!-- Template：articleListTpl.juicer -->

{@if model.list.length > 0}
    <ul>
        {@each model.list as item, index}
             <li>
             	<a href='${item.url}'>${item.title}</a>
             	<div>${item.desc} -- <span style="color:#999;">${item.date}</span></div>
             </li>
        {@/each}
    </ul>
{@/if}

```

```javascript
//注重看到config里面的async和data字段的配置，以及Component.setData中更新apiUrl的方式
//更新API URL，会自动重新请求数据

KISSY.use(['./mvm', './articleListTpl', 'dom', 'mui/pagination'], function(S, MVM, ArticleListTpl, DOM, Pagination){

	var Component = MVM.create({
		container : "articleList",
		//template目前是juicer的模板对象，暂时不支持字符串形式的模板
		template : IndexTpl,
		//是否异步请求的形式
		async : true,
		data : {
			apiUrl : "sample/ajax.do?page=1",
			//dataType可以是json或者jsonp等
			dataType : "json",
			//params : {} 直接传递一个对象也是可以的哦
			//传递一个函数过来，返回一个对象也是可以的哦
			params : function(){ 
				return { keyword : DOM.val("#J_val") }; 
			}
		}
	});

	// 初始化
	var pagination = new Pagination({
		container: '#J_Page',
		totalPage: 10
	});

	// 监听页码变化
	pagination.on('afterPageChange', function(e){
		Component.setData("apiUrl", "sample/ajax.do?page=" + e.idx);
	});

});

```

* 当然如果对render View的时候不想要内置的，可以自定义render函数，也就是拿到变化后的数据想做一些特殊处理，然后更新View

```javascript

var Component = MVM.create({
	//template目前是juicer的模板对象，暂时不支持字符串形式的模板
	template : IndexTpl,
	data : {
		model : {
			list : [ { "title" : "xxxxx111", "url" : "http://example.com", "desc" : "sdfsdfdsf", "date" : "2015-3-31" } ]
		}
	},
	//可以自定义render的函数，参数就是data的内容
	render : function(json){  
		console.log("render by customer...");

		var html = IndexTpl(json);
		DOM.html("articleList", html);
	}
});

```

* 对原始数据需要特殊处理一下的场景，这个也是比较常见的

```javascript

var Component = MVM.create({
	container : "articleList",
	//template目前是juicer的模板对象，暂时不支持字符串形式的模板
	template : IndexTpl,
	//是否异步请求的形式
	async : true,
	//可以在触发数据变化之前，对数据进行一些特殊处理
	before : function(json){
		json.model.list.forEach(function(item){
			item.title2 = "before insert...";
		});
		return json;
	},
	data : {
		apiUrl : "sample/ajax.do?page=1",
		//params : {} 直接传递一个对象也是可以的哦
		//传递一个函数过来，返回一个对象也是可以的哦
		params : function(){ 
			return { keyword : DOM.val("#J_val") }; 
		}
	}
});

```


