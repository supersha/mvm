var _requires = [
	'io', 
	'./observe.poly'
];


KISSY.add("mvm", function(S, IO){
	var request = function(api, dataType, params, callback){
		var data = {};

		dataType = dataType || "json";

		if(params){
			data = (typeof params == "function") ? params() : params;
		}

		var io = new IO({
			url : api,
			dataType : dataType,
			data : data,
			success : function(json){
				callback && callback(json);
			}
		});
	};

	var MVM = function(options){ 
		var me = this;

		me._rootData = {};
		me._apiUrlData = { apiUrl : "" };
		if(options){
			me.config(options);
		}
	};

	MVM.prototype = {
		constructor : MVM,
		props : {},
		initProps : function(options){
			if(!options){ return; }

			for(var key in options){
				if(options.hasOwnProperty(key)){
					this.props[key] = options[key];
				}
			}
		},
		setProps : function(key, value){
			if(S.isObject(key)){
				for(var k in key){
					if(key.hasOwnProperty(k)){
						this.props[k] = key[k];
					}
				}
			}else{
				this.props[key] = value;
			}
		},
		initData : function(data){
			this._rootData = this._before(data);

			if(this._rootData){
				this._render(this._rootData);
				this._observe(this._rootData);
			}
		},
		getData : function(){ return this._rootData; },
		setData : function(key, value){ 
			//如果修改的是apiUrl，则进行特殊处理一下
			if(key === "apiUrl"){
				this._apiUrlData.apiUrl = value;
				return;
			}

			var keys = key.split("."),
				last = keys.pop(),
				obj = this._rootData;

			keys.forEach(function(item){
				item && (obj = obj[item]);
			});

			obj[last] = value;
		},
		changeApiUrl : function(){
			var api = this._apiUrlData.apiUrl;
			this._apiUrlData.apiUrl = this._apiUrlData.apiUrl + (api.indexOf("?") !== -1 ? "&" : "?") + "_r=" + (+new Date());
		},
		_render : function(data){
			if(!this._container){ return; }

			var html = this._template(this._rootData);
			if(typeof this._container == "string"){
				document.querySelector(this._container).innerHTML = html;
			}else{
				this._container.innerHTML = html;
			}
		},
		_observe : function(data){
			var me = this;

			Object.observe(data, function(){ 
				me._render(me._rootData);

				me._afterChange.call(me, me._rootData);
			});

			for(var key in data){
				if(data.hasOwnProperty(key)){
					var type = typeof data[key];
					if((type=== "object") && (data[key])){
						me._observe(data[key]);
					}
				}
			}
		},
		config : function(options){
			var me = this;
			me._container = options.container;
			me._template = options.template;
			//先对数据进行一个特殊的处理，然后再进行监控的回调函数
			//针对的场景就是需要对数据进行处理一下，然后传给模板进行渲染的场景
			me._before = options.before || function(json){ return json; };

			me._beforeChange = options.beforeChange || function(){};
			me._afterChange = options.afterChange || function(){};

			if(options.didCreated){
				options.didCreated.call(me);
			}
			
			//自定义render回调函数
			me._render = options.render || me._render;

			var _params = null,
				_dataType = null;

			//watch apiUrl的变化
			Object.observe(me._apiUrlData, function(){

				request(me._apiUrlData.apiUrl, _dataType,  _params, function(json){
					if(!S.isEmptyObject(me._rootData)){ me._beforeChange.call(me, me._rootData); }

					me._rootData = me._before(json);
					me._render(me._rootData);
					me._observe(me._rootData);

					me._afterChange.call(me, me._rootData);
				});
			});

			//如果是Ajax异步的方式
			if(options.async){
				_params = options.data.params;
				_dataType = options.data.dataType;
				me._apiUrlData.apiUrl = options.data.apiUrl;
			}else{
				if(options.data){
					if(!S.isEmptyObject(me._rootData)){ me._beforeChange.call(me, me._rootData); }

					me._rootData = me._before(options.data);

					me._render(me._rootData);
					me._observe(me._rootData);
				}
			}
		}
	};

	MVM.create = function(options){
		return new MVM(options);
	}

	return MVM;
}, {
	requires : _requires
});