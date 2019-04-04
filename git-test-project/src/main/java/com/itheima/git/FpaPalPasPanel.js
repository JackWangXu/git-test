/**
* FPA补录
* 保灵通补录
*/

if ("undefined" == typeof(portal.maintain)) {
    Ext.namespace("portal.maintain");
}

portal.maintain.FpaPalPasPanel = Ext.extend(Ext.Panel, {
	tskId: this.tskId,
    border: false,
    layout: 'fit',
    initComponent: function() {
        portal.maintain.FpaPalPasPanel.superclass.initComponent.call(this);
        
        //获取url中的tskId
        var cThis = this;
        if(!cThis.tskId) {
    		var hashLocation = window.location.hash;
    		var items = hashLocation.split("|");
    		if(items.length > 1) {
    			cThis.tskId = items[1];
    		}
    	}
        if (!cThis.tskId) {
        	Ext.MessageBox.alert("提示","页面传参错误！请返回页面或重新刷新页面。");
        	return;
        }
        
        taskUtilGetTaskInfo(cThis.tskId, function(resultData) {
        	if (resultData) {
    			var tskStatus = resultData.tskSts;
    			if (tskStatus == portal.constant.task.DSC_WAITING) {
    				taskUtilUpdToDoingTask(cThis.tskId);
    			}
    			cThis.readOnly = (tskStatus == portal.constant.task.AUDIT_WAITING ||
					tskStatus == portal.constant.task.VALIDATE_WAITING ||
					tskStatus == portal.constant.task.DSC_SUCCESS);
    			if (cThis.readOnly) {
    		        cThis.grid.toolbars[0].items.items[4].hidden = true;
    		        cThis.grid.toolbars[0].items.items[5].hidden = true;
    		        cThis.grid.toolbars[0].items.items[6].hidden = true;
    		        cThis.grid.toolbars[0].items.items[7].hidden = true;
    		        cThis.grid.toolbars[0].items.items[9].hidden = true;
    		        cThis.grid.toolbars[0].items.items[10].hidden = true;
    		        cThis.grid.toolbars[0].items.items[11].hidden = true;
    			}
    			cThis.add(cThis.grid);
		        cThis.doLayout();
		        return;
    		}
        });

        //页面功能：查询、新增、删除、保存、导入、导出、校验、提交
        var queryable = this.queryable;
        var newable = this.newable;
        var deleteable = this.deleteable;
        var saveable = this.saveable;
        var importable = this.importable;
        var exportable = this.exportable;
        var submitable = this.submitable;
        var forceSubmitable = false;
        if(this.hiddenForceSubmit){
        	forceSubmitable = false;
        }
        else{
	        if(window.userInfo.indexOf(portal.constant.FORCE_SUBMIT_KEY) == -1){
	        	forceSubmitable = false;
	        }else{
	        	forceSubmitable = true;
	        }
        }

        //一级分行编号
        var bbkNbrStore = new Ext.data.JsonStore({
            url: portal.url.ACCOUNTING_BASE_URL + '/api/dim/bbkNbr',
            method:'GET',
            root: 'data',
            fields: ['dimCode','dimName']
        });
        bbkNbrStore.load();
        var BBKNbrCom = new Ext.form.ComboBox({ //定义该列的编辑控件
            store: bbkNbrStore,
            valueField: 'dimCode',
            displayField: 'dimName',
            allowBlank: false,
            width: 160,
            mode: 'local',
            triggerAction: 'all',
            selectOnFocus: true,
            forceSelection: true,
            listeners:{
                select:function(){
                	cThis.grid.selected.set('bbkNam',BBKNbrCom.getRawValue());
                	brnNbrStore.proxy = new Ext.data.HttpProxy({url:portal.url.ACCOUNTING_BASE_URL 
                		+ '/api/dim/brnNbr?bbkNbr='+BBKNbrCom.getValue()});
                	brnNbrStore.reload();
                	entNbrStore.proxy = new Ext.data.HttpProxy({url:portal.url.ACCOUNTING_BASE_URL 
                		+ '/api/dim/entNbr?bbkNbr='+BBKNbrCom.getValue()});
                	entNbrStore.reload();
                }
            }
        });
        
        //网点编号，根据一级分行联动
        var brnNbrStore = new Ext.data.JsonStore({
            url: portal.url.ACCOUNTING_BASE_URL + '/api/dim/brnNbr',
            method:'GET',
            root: 'data',
            fields: ['dimCode','dimName']
        });
        var BRNNbrCom = new Ext.form.ComboBox({ //定义该列的编辑控件
            store: brnNbrStore,
            valueField: 'dimCode',
            displayField: 'dimName',
            allowBlank: false,
            width: 160,
            mode: 'local',
            triggerAction: 'all',
            selectOnFocus: true,
            forceSelection: true,
            listeners:{
                select:function(){
                	cThis.grid.selected.set('brnNam',BRNNbrCom.getRawValue());
                }
            }
        });

        //叙做方式下拉框
        var bltTypStore = new Ext.data.JsonStore({
			url : portal.url.TASK_BASE_URL
					+ '/api/dim/dimType?type=BLTTYP',
			root : 'data',
			fields : [ 'dimCode', 'dimName' ]
		});
        bltTypStore.load();
		var BLTTypCom = new Ext.form.ComboBox({ // 定义该列的编辑控件
			store : bltTypStore,
			fieldLabel : '叙做方式',
			valueField : 'dimName',
			displayField : 'dimName',
			hiddenName : 'bltTyp',
			typeAhead : true,
			allowBlank : false,
			anchor : '90%',
			mode : 'local',
			triggerAction : 'all',
			// emptyText:'',
			selectOnFocus : true,
			forceSelection : true
		});
        
        //经营机构编号
        var entNbrStore = new Ext.data.JsonStore({
            url: portal.url.ACCOUNTING_BASE_URL + '/api/dim/entNbr',
            method:'GET',
            root: 'data',
            fields: ['dimCode', 'dimName']
        });
        entNbrStore.load({
        	callback: function(){
        		cThis.store.load({
        			callback: function() {
        				hidePageLoading();
        				storeLoadCallback(store, '加载数据失败！');
        			}
        		});
        	}
        });
        var ENTNbrCom = new Ext.form.ComboBox({ //定义该列的编辑控件
            store: entNbrStore,
            valueField: 'dimCode',
            displayField: 'dimName',
            allowBlank: true,
            width: 160,
            mode: 'local',
            triggerAction: 'all',
            emptyText:'',
            selectOnFocus: true,
            forceSelection: true,
            editable : true,
            listeners:{
                select:function(){
                	cThis.grid.selected.set('entNam',ENTNbrCom.getRawValue().split(" ")[1]);
                }
            }
        });
        
        var colMap = new Array(); //列配置映射
        var dataType = new Array(); //列数据类型
        var colum = new Array();
        var cname = ["pk","tskID", "bbkNbr", "bbkNam", "brnNbr", "brnNam", "bltTyp", "trxDte", "busNbr", 
                     "cltNbr", "cltNam", "ccyNbr", "bltCcy","balAmt", "intDte", "matDte", 
                     "swfCod", "swfNam","inSwfCod", "inSwfNam", "entNbr", "entNam","datKey"];
        var cn = 0;
        
        var sm = new Ext.grid.CheckboxSelectionModel();

        var baseParamsItems = {};
        if (cThis.searchedPanel) {
        	baseParamsItems = cThis.searchbaseParams;
    	}
        baseParamsItems.tskId = cThis.tskId;
        baseParamsItems.start = 0;
        baseParamsItems.limit = portal.constant.PAGE_SIZE;
        var store = new Ext.data.Store({ //表格数据store
        	proxy : new Ext.data.HttpProxy({
        		url: cThis.url ? cThis.url : portal.url.ACCOUNTING_BASE_URL + '/api/fpa/palPas',
                method: 'GET'
            }),
            pruneModifiedRecords : true,
            baseParams: baseParamsItems,
            reader: new Ext.data.JsonReader({
                totalProperty: "total",
                root: "data"
            }, cname)
        });

        cThis.store = store;
        //加载数据
        showPageLoading();
        function reload() {
        	showPageLoading();
        	store.reload({ //刷新表格Store
                callback: function() {
                    hidePageLoading();
                    storeLoadCallback(store, '刷新失败！');
                }
            });
        }

        function reload() {
            showPageLoading();
            store.reload({ //刷新表格Store
                callback: function() {
                    hidePageLoading();
                    storeLoadCallback(store, '刷新失败！');
                }
            });
        }
        function validateAllGBK (dataValue){
       		var bValid = false;
     
            var value = dataValue;
            if (value.length > 0) { 
    	         if ( value.indexOf(">") >= 0 ||value.indexOf("<") >= 0 
             	||value.indexOf("@") >= 0 ||value.indexOf("$") >= 0 
             	||value.indexOf("(") >= 0 ||value.indexOf(")") >= 0 
             	||value.indexOf("&") >= 0 ||value.indexOf("*") >= 0              	
             	||value.indexOf("'") >= 0 ||value.indexOf("#") >= 0 
             	||value.indexOf("%") >= 0 ||value.indexOf("+") >= 0
             	||value.indexOf("^") >= 0 ||value.indexOf("!") >= 0)
                   bValid = true;
              else
                   bValid = false;
            }
            return bValid;
        }
        

        function rowclick(grid, rowIndex, e) {
            grid.selected = grid.getStore().getAt(rowIndex);
        }
        
        function formatInput(obj) { //将有关联关系的列属性在输入时进行设置，主要针对新增记录
            if (typeof colMap[obj.field] == 'undefined') return;
            var codname = obj.value.split('-');
            obj.record.set(obj.field, codname[1]); //设置名称到当前列
            obj.record.set(colMap[obj.field], codname[0]); //设置值或cod到其关联的列
        }
        //新增函数
        function addHander(){
        	var rec = [{
                name: "bbkNbr",
                type: "string"
            }, {
                name: "bbkNam",
                type: "string"
            }, {
                name: "brnNbr",
                type: "string"
            }, {
                name: "brnNam",
                type: "string"
            }, {
            	name: "bltTyp",
            	type: "string"
            }, {
            	name: "trxDte",
            	type: "date"
            }, {
            	name: "busNbr",
                type: "string"
            }, {
            	name: "cltNbr",
                type: "string"
            }, {
            	name: "cltNam",
                type: "string"
            }, {
            	name: "ccyNbr",
                type: "string"
            }, {
            	name: "bltCcy",
            	type: "string"
            }, {
            	name: "balAmt",
                type: "string"
            }, {
            	name: "intDte",
                type: "date"
            }, {
            	name: "matDte",
                type: "date"
            }, {
            	name: "swfCod",
                type: "string"
            },{
            	name: "swfNam",
                type: "string"
            }, {
            	name: "inSwfCod",
                type: "string"
            }, {
            	name: "inSwfNam",
                type: "string"
            }, {
            	name: "entNbr",
            	type: "string"
            }, {
            	name: "entNam",
                type: "string"
            },{}];
            var row = Ext.data.Record.create(rec);
            var str = '{';
            for (var i = 0; i < cname.length; i++) str += cname[i] + ':' + "'',";
            if (str.length > 1) str = str.substring(0, str.length - 1);
            str += '}';
            str = 'new row(' + str + ')';
            var addrow = eval(str);

            addrow.data.addFlag = true;

            grid.getStore().insert(grid.getStore().getCount(), addrow);
            grid.getView().focusRow(grid.getStore().getCount() - 1);
            sm.selectLastRow();
        };
        
        //保存按钮
        function saveHander(reloadable) {
        	var selected = getRealModifiedRecords(store);
            if (selected.length < 1) {
            	Ext.MessageBox.alert('提示', '您未更改记录，无需保存！');
                return;
            }

            var selectedLen = selected.length;
            for (var i = 0; i < selectedLen; i++) {
            	
            	var bbkNbr = selected[i].get('bbkNbr');
            	var bbkNam = selected[i].get('bbkNam');
            	var brnNbr = selected[i].get('brnNbr');
            	var brnNam = selected[i].get('brnNam');
            	var bltTyp = selected[i].get('bltTyp');
            	var trxDte = selected[i].get('trxDte');
            	var cltNbr = selected[i].get('cltNbr');
            	var balAmt = selected[i].get('balAmt');
            	var entNbr = selected[i].get('entNbr');
            	var entNam = selected[i].get('entNam');
            	var intDte = selected[i].get('intDte');
                var matDte = selected[i].get('matDte');
                var busNbr = selected[i].get('busNbr');
                var cltNam = selected[i].get('cltNam');
                var ccyNbr = selected[i].get('ccyNbr');
                var bltCcy = selected[i].get('bltCcy');
                var swfCod = selected[i].get('swfCod');
                var swfNam = selected[i].get('swfNam');
                var inSwfCod = selected[i].get('inSwfCod');
                var inSwfNam = selected[i].get('inSwfNam');
                
                
            	//空行数据
            	if((""==bbkNbr || bbkNbr==null) && (""==bbkNam || null==bbkNam) 
            			&& ("" == brnNbr || null == brnNbr) && ("" == brnNam || null == brnNam) 
            			&& ("" == bltTyp || null == bltTyp) && ("" == trxDte || null == trxDte) 
            			&& ("" == busNbr || null == busNbr) && ("" == cltNbr || null == cltNbr) 
            			&& ("" == cltNam || null == cltNam) && ("" == ccyNbr || null == ccyNbr) 
            			&& ("" == bltCcy || null == bltCcy) && ("" == balAmt || null == balAmt) 
            			&& ("" == intDte || null == intDte) && ("" == matDte || null == matDte) 
            			&& ("" == swfCod || null == swfCod) && ("" == swfNam || null == swfNam) 
            			&& ("" == inSwfCod || null == inSwfCod) && ("" == inSwfNam || null == inSwfNam) 
            			&& ("" == entNbr || null == entNbr) && ("" == entNam || null == entNam)){
            		hidePageLoading();
            		Ext.MessageBox.alert('提示', '存在空行数据，请删除后再保存。');
                    return false;
            	}

                //起息日在到期日之前
                if(null != intDte || null != matDte ){
                	if(intDte > matDte){
                		hidePageLoading();
                		Ext.MessageBox.alert('提示', '起息日应在到期日之前。');
                        return false;
                	}
                }
                
                //保理业务编号长度判断
                if(busNbr.length > 10){
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '保理业务编号长度不超过10。');
                    return false;
                }
                
                //客户名称长度判断
            	if (cltNam.length > 66) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '客户名称长度不超过66位汉字。');
                    return false;
                }
                
                //单据币别长度判断
            	if (ccyNbr.length > 10) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '单据币别长度不超过10。');
                    return false;
                }
                
                //保灵通币别长度判断
            	if (bltCcy.length > 10) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '保灵通币别长度不超过10。');
                    return false;
                }
            	
            	//保灵通金额最大值判断
            	if(balAmt > 9999999999999999.99 || balAmt < -9999999999999999.99){
            		hidePageLoading();
            		Ext.MessageBox.alert('提示', '保灵通金额在-9999999999999999.99和9999999999999999.99之间。');
                    return false;
            	}
                
                //买方保理商SWIFT代码
                if (swfCod.length > 20) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '买方保理商SWIFT代码长度不超过20。');
                    return false;
                }
                
                //买方保理商全称
                if (swfNam.length > 66) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '买方保理商全称长度不超过66个汉字。');
                    return false;
                }
                
                //参与行/买入行SWIFT代码
                if (inSwfCod.length > 20) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '参与行/买入行SWIFT代码长度不超过20。');
                    return false;
                }
                
                //参与行/买入行全称
                if (inSwfNam.length > 66) {
                	hidePageLoading();
            		Ext.MessageBox.alert('提示', '参与行/买入行全称长度不超过66个汉字。');
                    return false;
                }              
                
                //新增和修改
                Ext.MessageBox.confirm('提示', '将保存所有新增和修改的记录。确认保存？', makeSure);
                function makeSure(id) {
                    if (id == 'yes') {
                        var select = '[';
                        var org = '[';
                        var add = '[';
                        //保存所有新增和修改的记录
                        for (var i = 0; i < selected.length; i++) {
                        	//修改的记录
                        	if (selected[i].get('addFlag') != true) {
                        		org += '{"select":' + (i + 1) + ',' + Ext.util.JSON.encode(selected[i].json).substring(1) + ',';
                        		select += '{"select":' + (i + 1) + ',' + Ext.util.JSON.encode(selected[i].data).substring(1) + ',';
                        	}
                        	//新增的记录
                        	else {
                        		selected[i].data.tskId = cThis.tskId;
                        		add += Ext.util.JSON.encode(selected[i].data) + ',';
                        	}
                        }

                        if (select.length > 1) {
                            select = select.substring(0, select.length - 1);
                            org = org.substring(0, org.length - 1);
                        }
                        if (add.length > 1) add = add.substring(0, add.length - 1);
                        select += ']';
                        org += ']';
                        add += ']';
                        //alert(org); 
                        if (add == '[]' && select == '[]') {
                            return;
                        }

                        showPageLoading();
                        Ext.Ajax.request({ //处理修改的记录
                            url: portal.url.ACCOUNTING_BASE_URL + '/api/fpa/palPas',
                            method:'PUT',
                            params: Ext.util.JSON.encode({
                                result: eval("(" + select + ")"),
                                orgValue: eval("(" + org + ")")
                            }),
                            'headers': {
                                'Content-Type': 'application/json'
                            },
                            callback: function(options, succ, response) {
                                if (!ajaxRequestCallback(options, succ, response, null, '数据修改失败!')) {
                                    hidePageLoading();
                                    return;
                                }
                                Ext.Ajax.request({ //处理新增的记录
                                    url: portal.url.ACCOUNTING_BASE_URL + '/api/fpa/palPas',
                                    params: add,
                                    'headers': {
                                        'Content-Type': 'application/json'
                                    },
                                    callback: function(options, succ, response) {
                                        hidePageLoading();
                                        if (!ajaxRequestCallback(options, succ, response, null, '新增数据插入失败！')) {
                                            return;
                                        }
                                        reload(); //重建加载数据                                
                                    }
                                });
                            }
                        });
                    }
                }
            }
        };

        var gridTb = new Ext.Toolbar([{
            iconCls: 'navigator_path'
        },
        this.searchtitle ? this.searchtitle : navigatorPath || '', '->', {
            hidden: !queryable,
            tooltip: {
                text: '查询',
                anchor: 'top'
            },
            iconCls: 'toolbar-query',
            handler: function() {
            	var win = new PalPasSearchWindow();
        		win.show();
            }
        },
        {
            hidden: !newable,
            tooltip: {
                text: '新增',
                anchor: 'top'
            },
            iconCls: 'toolbar-add',
            handler: function() {
            	addHander();
            }
        },
        {
            hidden: !deleteable,
            tooltip: {
                text: '删除',
                anchor: 'top'
            },
            iconCls: 'toolbar-delete',
            handler: function() {
                var selected = sm.getSelections();

                if (selected.length < 1) {
                    Ext.MessageBox.alert('提示', '请先选择需要删除的记录！');
                    return;
                }

                Ext.MessageBox.confirm('提示', '确认删除该记录？',
                function(id) {
                    if (id != 'yes') return;

                    var org = '[';
                    for (var i = 0; i < selected.length; i++) {
                        if (selected[i].get('addFlag') == true) {
                            store.remove(selected[i]);
                            continue;
                        }
                        org += '{' + Ext.util.JSON.encode(selected[i].json).substring(1) + ',';
                    }
                    if (org.length > 2) org = org.substring(0, org.length - 1);
                    org += ']';
                    if (org == '[]') return;

                    showPageLoading();
                    Ext.Ajax.request({ //处理删除的记录
                        url: portal.url.ACCOUNTING_BASE_URL + '/api/fpa/palPas',
                        method:'DELETE',
                        params: org,
                        'headers': {
                            'Content-Type': 'application/json'
                        },
                        callback: function(options, succ, response) {
                            hidePageLoading();
                            if (ajaxRequestCallback(options, succ, response, null, '删除失败！')) reload();
                        }
                    });
                });
            }
        },
        {
            hidden: !saveable,
            tooltip: {
                text: '保存',
                anchor: 'top'
            },
            iconCls: 'toolbar-save',
            handler: function() {
            	saveHander(true);
            }
        }, {
            hidden: !importable,
            tooltip: {
                text: '导入',
                anchor: 'top'
            },
            iconCls: 'toolbar-upload',
            handler: function() {
            	var win = new portal.maintain.ImportExcelFileWin({
            		url: portal.url.ACCOUNTING_BASE_URL + '/api/fpa/palPas/excel',
            		fn : function() {
            			reload();
            		},
            		tskId : cThis.tskId
            	});
            	win.show();
            }
        }, {
            hidden: !exportable,
            tooltip: {
                text: '导出',
                anchor: 'top'
            },
            iconCls: 'toolbar-export',
            handler: function() {
            	Ext.select("#downloadGenDedDiv");
            	if (Ext.select("#downloadGenDedDiv").elements.length === 0) {
            		var dom = "<div id='downloadGenDedDiv' style='display:none;'><a href='" 
            		+ portal.url.ACCOUNTING_BASE_URL + encodeURI('/api/fpa/palPas/excel?tskId='+ cThis.tskId) 
            		+"' target='downloadGenDedIFrame'><span></span></a><iframe name='downloadGenDedIFrame'></iframe></div>";
            		Ext.select("body").insertHtml('beforeEnd',dom);
            	} else {
            		Ext.select("#downloadGenDedDiv a").set({"href":portal.url.ACCOUNTING_BASE_URL + encodeURI('/api/fpa/palPas/excel?tskId=' + cThis.tskId)});
            	}
            	Ext.select("#downloadGenDedDiv span").elements[0].click();
            }
        }, {
            hidden: !submitable,
            tooltip: {
                text: '校验',
                anchor: 'top'
            },
            iconCls: 'toolbar-check',
            handler: function() {
            	
            	var isModified = getRealModifiedRecords(cThis.grid.getStore()).length > 0;
            	if(isModified){
            		Ext.MessageBox.confirm('提示', '存在未保存数据,是否先进行保存？', makeSureOut);
            		function makeSureOut(id) {
                		if ('no' == id) {
                			Ext.MessageBox.confirm('提示', '校验后列表中的数据仍可修改。请确认是否校验？', makeSure);
                        	function makeSure(id) {
                        		if ('yes' != id) {
                        			return;
                        		}
                        		taskUtilCheckTask(cThis.tskId, "FPA_PAL_PAS_MID", function() {
                        			reload();
                        		});
                        	}
                		}else if('yes' == id){
                    		saveHander(true);
                		}
                	}
            	}else{
            		Ext.MessageBox.confirm('提示', '校验后列表中的数据仍可修改。请确认是否校验？', makeSurec);
                	function makeSurec(id) {
                		if ('yes' != id) {
                			return;
                		}
                		taskUtilCheckTask(cThis.tskId, "FPA_PAL_PAS_MID", function() {
                			reload();
                		});
                	}
            	}
            }
        }, {
            hidden: !submitable,
            tooltip: {
                text: '提交',
                anchor: 'top'
            },
            iconCls: 'toolbar-submit',
            handler: function() {            	            	
            	var isModified = getRealModifiedRecords(cThis.grid.getStore()).length > 0;           	
            	if(isModified){
            		Ext.MessageBox.confirm('提示', '存在未保存数据,是否先进行保存？', makeSureOut);
            		function makeSureOut(id) {
                		if ('no' == id) {
                			Ext.MessageBox.confirm('提示', '提交后，列表中的数据将不可修改，请确认是否提交？', makeSure);
                        	function makeSure(id) {
                        		if ('yes' != id) {
                        			return;
                        		}
                        		taskUtilSubmitTask(cThis.tskId, "FPA_PAL_PAS_MID", function() {
                        			reload();
                        		});
                        		var toolbar = cThis.grid.toolbars[0];
                        		toolbar.remove(toolbar.items.items[10]);
                        		toolbar.remove(toolbar.items.items[9]);
                        		toolbar.remove(toolbar.items.items[7]);
                        		toolbar.remove(toolbar.items.items[6]);
                        		toolbar.remove(toolbar.items.items[5]);
                        		toolbar.remove(toolbar.items.items[4]);
                        		cThis.readOnly = true;
                        	}
                		}else if('yes' == id){
                    		saveHander(true);
                		}
                	}
            	}else{
            		Ext.MessageBox.confirm('提示', '提交后，列表中的数据将不可修改，请确认是否提交？', makeSurec);
                	function makeSurec(id) {
                		if ('yes' != id) {
                			return;
                		}
                		taskUtilSubmitTask(cThis.tskId, "FPA_PAL_PAS_MID", function() {
                			reload();
                		});
                		var toolbar = cThis.grid.toolbars[0];
                		toolbar.remove(toolbar.items.items[10]);
                		toolbar.remove(toolbar.items.items[9]);
                		toolbar.remove(toolbar.items.items[7]);
                		toolbar.remove(toolbar.items.items[6]);
                		toolbar.remove(toolbar.items.items[5]);
                		toolbar.remove(toolbar.items.items[4]);
                		cThis.readOnly = true;
                	}
            	}      	
            }
        },{
            hidden: !forceSubmitable,
            tooltip: {
                text: '强制提交',
                anchor: 'top'
            },
            iconCls: 'toolbar-force-submit',
            handler: function() {
            	
               	var isModified = getRealModifiedRecords(cThis.grid.getStore()).length > 0;
            	
            	if(isModified){
            		Ext.MessageBox.confirm('提示', '存在未保存数据,是否先进行保存？', makeSureOut);
            		function makeSureOut(id) {
                		if ('no' == id) {
                			Ext.MessageBox.confirm('提示', '强制提交将跳过客户号的检验，然后进入待审核状态，请确认是否强制提交？', makeSure);
                        	function makeSure(id) {
                        		if ('yes' != id) {
                        			return;
                        		}
                        		taskUtilFpaUpdToAuditWaiting(cThis.tskId, "FPA_PAL_PAS_MID",function() {
                        			reload();
                        		});
                        		var toolbar = cThis.grid.toolbars[0];
                        		if(toolbar.items.items[11]){
                        			toolbar.remove(toolbar.items.items[11]);
                        		}
                        		toolbar.remove(toolbar.items.items[10]);
                        		toolbar.remove(toolbar.items.items[9]);
                        		toolbar.remove(toolbar.items.items[7]);
                        		toolbar.remove(toolbar.items.items[6]);
                        		toolbar.remove(toolbar.items.items[5]);
                        		toolbar.remove(toolbar.items.items[4]);
                        		cThis.readOnly = true;
                        	}
                		}else if('yes' == id){
                    		saveHander(true);
                		}
                	}
            	}else{
            		Ext.MessageBox.confirm('提示', '强制提交将跳过客户号的检验，然后进入待审核状态，请确认是否强制提交？', makeSurec);
                	function makeSurec(id) {
                		if ('yes' != id) {
                			return;
                		}
                		taskUtilFpaUpdToAuditWaiting(cThis.tskId, "FPA_PAL_PAS_MID", function() {
                			reload();
                		});
                		var toolbar = cThis.grid.toolbars[0];
                		if(toolbar.items.items[11]){
                			toolbar.remove(toolbar.items.items[11]);
                		}
                		toolbar.remove(toolbar.items.items[10]);
                		toolbar.remove(toolbar.items.items[9]);
                		toolbar.remove(toolbar.items.items[7]);
                		toolbar.remove(toolbar.items.items[6]);
                		toolbar.remove(toolbar.items.items[5]);
                		toolbar.remove(toolbar.items.items[4]);
                		cThis.readOnly = true;
                	}
            	}
            	
            }
        }]);

        var intEdit = new Ext.form.NumberField({
            allowBlank: false,
            allowNegative: false,
            decimalPrecision: 0,
            minLength: 1,
            maxLength: 10,
            minValue: 0,
            maxValue: 9999999999
        });
        var doubleEdit = new Ext.form.TextField({
        	allowBlank : true,
        	maxLength: 20,
        	regex:/^[-+]?[0-9]*\.?[0-9]+$/
        });
        
        this.renderCheckResult = function(value, metadata, record, rowIndex, colIndex, css, arr, store) {
        	if (record.get("datKey")) {
        		var html = '<div class="checkresult-icon" title="校验错误！请双击此行查看校验结果" style="background: url(static/img/alert.png) no-repeat;' +
        			'position: absolute;margin-top: -20px; margin-left: 5px;width:20px;height:20px" ></div>';
        		return html;
        	}
        	return "";
        };
        
        this.renderTime = function(value, metadata, record, rowIndex, colIndex, css, arr, store) {
        	if(value == null || '' == value){
        		return "";
        	}
        	var date = value;
        	if(!(value instanceof Date)){
        		date = new Date(value);
        	}
    		date = date.dateFormat("Y-m-d");
    		return date;
    	};
        
    	var intDteEdit = new Ext.form.DateField({
        	format:"Y-m-d",
        	emptyText : '请选择',
        	enableKeyEvents : true ,
        	allowBlank: true,
        	listeners: {
        		//添加日期选择事件
        		"focus": function () {
        			var date = new Date(Ext.getCmp("allGrid").getSelectionModel().selections.items[0].get("intDte"));
            		date = date.dateFormat("Y-m-d");
            		intDteEdit.setValue(date);
        		}
        	}
        })
        
        var matDteEdit = new Ext.form.DateField({
        	format:"Y-m-d",
        	emptyText : '请选择',
        	enableKeyEvents : true ,
        	listeners: {
        		//添加日期选择事件
        		"focus": function () {
        			var date = new Date(Ext.getCmp("allGrid").getSelectionModel().selections.items[0].get("matDte"));
            		date = date.dateFormat("Y-m-d");
            		matDteEdit.setValue(date);
        		}
        	}
        })
    	
    	var trxDteEdit = new Ext.form.DateField({
        	format:"Y-m-d",
        	emptyText : '请选择',
        	enableKeyEvents : true ,
        	listeners: {
        		//添加日期选择事件
        		"focus": function () {
        			var date = new Date(Ext.getCmp("allGrid").getSelectionModel().selections.items[0].get("trxDte"));
            		date = date.dateFormat("Y-m-d");
            		trxDteEdit.setValue(date);
        		}
        	}
        })
        
        var cltNbrEdit = new Ext.form.TextField({
        	allowBlank : true,
        	maxLength: 10,
        	regex:/^[A-Za-z0-9]+$/
        });

        var simpleEdit = new Ext.form.TextField({});
        var simpleEditNumAndDig = new Ext.form.TextField({regex:/^[A-Za-z0-9]+$/});

        var cm = new Ext.grid.ColumnModel([sm, {
        	header: "校验",
            width: 35,
            sortable: false,
            dataIndex: 'bbkNbr',
            renderer: this.renderCheckResult
        },{
            header: "一级分行编码",
            width: 120,
            sortable: false,
            dataIndex: 'bbkNbr',
            editor: BBKNbrCom
        }, {
            header: "一级分行名称",
            width: 120,
            sortable: false,
            dataIndex: 'bbkNam'
        }, {
            header: "网点编码",
            width: 120,
            sortable: false,
            dataIndex: 'brnNbr',
            align: 'right',
            editor: BRNNbrCom
        }, {
            header: "网点名称",
            width: 180,
            sortable: false,
            dataIndex: 'brnNam',
            align: 'right'
        }, {
            header: "叙做方式",
            width: 90,
            sortable: false,
            dataIndex: 'bltTyp',
            align: 'right',
            editor:BLTTypCom
        }, {
            header: "交易日",
            width: 100,
            sortable: false,
            dataIndex: 'trxDte',
            renderer: this.renderTime,
            editor:trxDteEdit
        }, {
            header: "保理业务编号",
            width: 100,
            sortable: false,
            dataIndex: 'busNbr',
            editor: simpleEditNumAndDig,
        },{
            header: "客户号",
            width: 100,
            sortable: false,
            dataIndex: 'cltNbr',
            editor: cltNbrEdit
        }, {
            header: "客户名称",
            width: 180,
            sortable: false,
            dataIndex: 'cltNam',
            editor:simpleEdit
        },{
            header: "单据币别",
            width: 80,
            sortable: false,
            dataIndex: 'ccyNbr',
            editor:simpleEditNumAndDig
        }, {
            header: "保灵通币别",
            width: 80,
            sortable: false,
            dataIndex: 'bltCcy',
            editor:simpleEditNumAndDig
        },{
            header: "保灵通金额",
            width: 120,
            sortable: false,
            dataIndex: 'balAmt',
            editor: doubleEdit
        }, {
            header: "起息日",
            width: 100,
            sortable: false,
            dataIndex: 'intDte',
            renderer: this.renderTime,
            editor:intDteEdit
        },{
            header: "到期日",
            width: 100,
            sortable: false,
            dataIndex: 'matDte',
            renderer: this.renderTime,
            editor:matDteEdit
        }, {
            header: "买方保理商SWIFT代码",
            width: 160,
            sortable: false,
            dataIndex: 'swfCod',
            editor:simpleEditNumAndDig
        },{
            header: "买方保理商全称",
            width: 160,
            sortable: false,
            dataIndex: 'swfNam',
            editor:simpleEdit
        },{
            header: "参与行/买入行SWIFT代码",
            width: 160,
            sortable: false,
            dataIndex: 'inSwfCod',
            editor:simpleEditNumAndDig
        }, {
            header: "参与行/买入行全称",
            width: 160,
            sortable: false,
            dataIndex: 'inSwfNam',
            editor:simpleEdit
        },{
            header: "经营机构编号",
            width: 160,
            sortable: false,
            dataIndex: 'entNbr',
            editor: ENTNbrCom
        }, {
            header: "经营机构名称",
            width: 160,
            sortable: false,
            dataIndex: 'entNam'
        }]);

        var bbar=new Ext.PagingToolbar({
            pageSize: portal.constant.PAGE_SIZE,
            store: store,
            displayInfo: true,
            displayMsg: '显示第 {0} 条到 {1} 条记录，一共 {2} 条',
            emptyMsg: "没有记录",
            listeners :{
            	beforechange:function(){
            		if(cThis.readOnly){
            			return true;
            		}
            		var modifiedRecords = getRealModifiedRecords(store);
            		if(modifiedRecords.length > 0){
            			var result = saveHander(false);
            			hidePageLoading();
            			return result;
            		}
            	}
            }
        });

        var grid = new Ext.grid.EditorGridPanel({ //数据表格
        	id : "allGrid",
        	autoScroll: true,
            border: false,
            anchor: '100% 100%',
            layout: 'fit',
            clicksToEdit: 1,
            store: store,
            sm: sm,
            cm: cm,
            bbar: bbar, 
            tbar: gridTb,
            listeners: {
                'rowclick': rowclick,
                'afteredit': formatInput,
                'beforeedit': function(o){
                	brnNbrStore.proxy = new Ext.data.HttpProxy({url:portal.url.ACCOUNTING_BASE_URL 
                		+ '/api/dim/brnNbr?bbkNbr='+ o.record.data.bbkNbr});
                	brnNbrStore.reload();
                	entNbrStore.proxy = new Ext.data.HttpProxy({url:portal.url.ACCOUNTING_BASE_URL 
                		+ '/api/dim/entNbr?bbkNbr='+ o.record.data.bbkNbr});
                	entNbrStore.reload();
                	return !cThis.readOnly;
                }
            }
        });
        
        grid.on('rowdblclick', function(grid, rowIndex) {
    		var record = grid.getStore().getAt(rowIndex);
    		var pk = record.get('pk');
    		new portal.chkmng.ChkRstInfWin({tskId: cThis.tskId,datKey: pk}).show();    		
    	});       
        
        cThis.grid = grid;
        
    }
});
