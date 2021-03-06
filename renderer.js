const appE = require('electron').remote;
//appE is the electron object since app is already used for draw2d object
const { ipcRenderer } = require('electron');
const { dialog } = require('electron').remote;
//const draw2d = require('draw2d');
const fs = require('fs');
//import * as fileio from './js/fileio.js';
//connectionList holds the connected parts in an array: ["1,1,3"] line 1 connects input port1 to  part3
let activeDevice;
let activeName;
let originalName;
let numParts = 0;
let numLines = 0;
let lineID = 1;
let partID = 3;
let lineList = [];
let partList = [];
let connectionList = [];
let cascadeList = [];
let canvas;
let app;
let rfhCascade = {'Pin':-20,
                  'Fc':1000,
                  'BW':100,
                  'Funits':'MHz',
                  'plotActive':false,
                  'dataOutput':[],
                  'plotSVGWidth' : 960,
  		            'plotSVGHeight' : 700,
                  'domMax': 100,
  		            'domMin': 0,
                  'plotFrozen':false,
                  'dataOutputFreeze':[],
                  'nameArray':[]
};


ipcRenderer.on( 'channel1', (e, args) => {
  //console.log(args.action)
  if (args.action === 'save') {
    saveFile();
  }
  if (args.action === 'open') {
    openFile();
  }
  if (args.action === 'settings') {
    $('#powerInput').val(rfhCascade.Pin);
    $('#settingsModal').modal('show');
  }
})
//Application portion of Code///////
var rfh = {};

/**
 *
 * The **GraphicalEditor** is responsible for layout and dialog handling.
 *
 * @author Andreas Herz
 * @extends draw2d.ui.parts.GraphicalEditor
 */
rfh.Application = Class.extend(
{
    NAME : "rfh.Application",

    /**
     * @constructor
     *
     * @param {String} canvasId the id of the DOM element to use as paint container
     */
    init : function()
    {
	      this.view    = new rfh.View("canvas");
	  }
});


document.addEventListener("DOMContentLoaded",function () {


 var routerToUse =new draw2d.layout.connection.ManhattanConnectionRouter();
 app  = new rfh.Application();
 app.view.installEditPolicy(  new draw2d.policy.connection.DragConnectionCreatePolicy({
     createConnection: function(){
         var connection = new draw2d.Connection({
             id:lineID,
             stroke:3,
             outlineStroke:1,
             outlineColor:"#303030",
             color:"91B93E",
             router:routerToUse
         });
         lineList.push(lineID);

         let n;

         connection.on("removed",function(){
           let i=0;
           while(i<connectionList.length){
             if(connectionList[i].split(",")[0] == connection.getId()){
               connectionList.splice(i,1);
               i = connectionList.length;
             }
             else {
               i++;
             }
             //clearPlot();
             app.view.getFigure(0).setText("RESULTS");
           }
           //FIX clearPlot
           clearPlot();
         });
         connection.on('added', function(){
           connectionList.push(connection.getId()+","+connection.getSource().getParent().getId() + ","+connection.getTarget().getParent().getId());
           console.log(connectionList);
         });
         connection.on("added",function(){
           let a = alignCascade(connection.canvas.getFigures().data.length-1); //pass number of parts
           if (a[0]  == 0) {
             console.log('ready to calculate');
             calcCascade(a[1]);
           }
           else {
             console.log('not ready');
           }
         });
         lineID++;
         return connection;
     }
 }));
 //Create button functionality
$('#savePartPropsButton').on('click',function () { validateInputs('rfhDeviceForm',function() {saveProperties()}) });
$('#saveMainSettingsButton').on('click',function () {saveMainSettings()});
$('#plotTypeSelect').on('change',function () {plotData('update')});
$('#rfhButtonSaveFile').on('click', function() {saveFile()});
$('#rfhButtonOpenFile').on('click', function() {openFile()});
//Create input and output elements and results bloxk
var figure =  new draw2d.shape.node.Start({id:1,color: "#3d3d3d"});
var label = new draw2d.shape.basic.Label({text:"Input", color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
var labelAdd = figure.add(label, new draw2d.layout.locator.TopLocator(figure));
figure.setDeleteable(false);
figure.getPort("output0").on("connect", function(p) {p.setVisible(false)});
figure.getPort("output0").on("disconnect", function(p) {p.setVisible(true)});
figure.setUserData({Name:"Input"});
app.view.add(figure,100,100);

figure =  new draw2d.shape.node.End({id:2,color: "#3d3d3d"});
label = new draw2d.shape.basic.Label({text:"Output", color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
figure.add(label, new draw2d.layout.locator.TopLocator(figure));
figure.setDeleteable(false);
figure.getPort("input0").on("connect", function(p) {p.setVisible(false)});
figure.getPort("input0").on("disconnect", function(p) {p.setVisible(true)});
figure.setUserData({Name:"Output"});
app.view.add(figure,500,100);

var msg = new draw2d.shape.note.PostIt({id:0,text:"RESULTS", x:400, y:100});
msg.setDeleteable(false);
app.view.add(msg,600,100);

});
///View portion of Code///////////
rfh.View = draw2d.Canvas.extend({

	init:function(id)
    {
		this._super(id, 2000,2000);

		this.setScrollArea("#"+id);
	},


    /**
     * @method
     * Called if the user drop the droppedDomNode onto the canvas.<br>
     * <br>
     * Draw2D use the jQuery draggable/droppable lib. Please inspect
     * http://jqueryui.com/demos/droppable/ for further information.
     *
     * @param {HTMLElement} droppedDomNode The dropped DOM element.
     * @param {Number} x the x coordinate of the drop
     * @param {Number} y the y coordinate of the drop
     * @param {Boolean} shiftKey true if the shift key has been pressed during this event
     * @param {Boolean} ctrlKey true if the ctrl key has been pressed during the event
     * @private
     **/
    onDrop : function(droppedDomNode, x, y, shiftKey, ctrlKey)
    {
			console.log($(droppedDomNode).attr("data-shape"));
			//var figure = new draw2d.shape.node.Between({id:partID});
      var figure = eval("new "+$(droppedDomNode).attr("data-shape")+"({id:partID})");
		//var figure = new draw2d.shape.analog.Amplifier({id:partID})
      let params = $(droppedDomNode).attr("data-params").split(",");
      console.log(params);
			var label = new draw2d.shape.basic.Label({text:"Part"+partID, color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
		  figure.add(label, new draw2d.layout.locator.TopLocator(figure));
			figure.setUserData({Name:"Part"+partID,G:params[0],NF:params[1],P1db:params[2],IP3:params[3],Psat:params[4],Pmax:params[5],disabled:false});
			figure.setWidth(100);
			figure.setResizeable(false);
			figure.setBackgroundColor('#ffffff');
			figure.getPort("input0").on("connect", function(p) {p.setVisible(false)});
		  figure.getPort("input0").on("disconnect", function(p) {p.setVisible(true)});
			figure.getPort("output0").on("connect", function(p) {p.setVisible(false)});
		  figure.getPort("output0").on("disconnect", function(p) {p.setVisible(true)});
			figure.on("dblclick", function() {
				activeDevice = figure.getId();
	      activeName = figure.getChildren().first().text;
	      $('#myModalLabel03').text(figure.getUserData().Name+" Properties")
        originalName = figure.getUserData().Name;
	      $('#deviceNameInput').val(figure.getUserData().Name);
	      $('#deviceGainInput').val(figure.getUserData().G);
	      $('#deviceNFInput').val(figure.getUserData().NF);
	      $('#deviceP1Input').val(figure.getUserData().P1db);
	      $('#deviceIp3Input').val(figure.getUserData().IP3);
	      $('#devicePsatInput').val(figure.getUserData().Psat);
	      $('#devicePmaxInput').val(figure.getUserData().Pmax);
	      $('#partPropsModal').modal('show');
				if (figure.getUserData().disabled){
					$('#disableDeviceCB').prop("checked",true);
				}
				else {
					$('#disableDeviceCB').prop("checked",false);
				}
			});
      figure.on("click", function() {
        activeDevice = figure.getId();
        activeName = figure.getChildren().first().text;
        console.log(activeName);
      });
      figure.on("removed", function(emitter,event) {
        rfhCascade.nameArray.splice(rfhCascade.nameArray.indexOf(figure.getChildren().first().text), 1);
        console.log(rfhCascade.nameArray);
        activeName = "";
      });
		  app.view.add(figure,x,y);
      rfhCascade.nameArray.push("Part"+partID);
      console.log(rfhCascade.nameArray);
			partID++;
    }
});

///RFH Cascade code///////////////////////////////
function alignCascade(numParts) {
  let N = connectionList.length;
//  let connectCheck = checkInOut();
  let cascadeList = [];
  let error = 0;
  let nextPart = 1;
/*  if (!connectCheck[0]) {
    error = 1; //no input port
  }
  if (!connectCheck[1]) {
    error = error+2; //no output port
  }
  if (error != 0) {
    return error;
  }*/
  if (numParts != connectionList.length+1) {
    error = 5; //unconnected part
    return error;
  }
  while (cascadeList.length != numParts-2) {
    connectionList.forEach(function(cList) {
      if(cList.split(",")[1] == nextPart) {
        if (cList.split(",")[2] != 2) {
          cascadeList.push(cList.split(",")[2]);
          nextPart = cList.split(",")[2];
        }
      }
    });
  }
  return [error,cascadeList];
}
// function checkInOut() {
//   let isConnectedOut = false;
//   let isConnectedIn = false;
//   let list = [];
//   connectionList.forEach(function(cList) {
//     list.push(cList.split(",")[1]);
//     list.push(cList.split(",")[2]);
//   });
//   if (list.includes("1")) {
//     isConnectedIn = true;
//   }
//   if (list.includes("2")) {
//     isConnectedOut = true;
//   }
//   return [isConnectedIn,isConnectedOut];
// }
function calcCascade(list) {
  var deviceArray = [];
	var partNames = [],partOP1db = [],partIP1db = [],partNF = [],partIIP3 = [],partOIP3 = [], partPower= [];
	var partX = [];
	var data = [];
	var xtick = 0;
	var index;
	var Gdb = 0;
	var G = 1;
	var NF = 1;
	var F = 0;
	var first = 0;
	var Gprev, Fa, IPprev, Pprev, GprevDB, IIPfinal, IP1final;
	var Glin;
	var IPa,ipn, gn, p1, P1a, Pina;
	var device;
	var NF, IP, P1, inP1, IIP3, Pin, pmax;
  rfhCascade.dataOutput =[];
  list.forEach(function(l) {
    if(!app.view.getFigure(parseInt(l)).getUserData().disabled){
      console.log(app.view.getFigure(parseInt(l)).getUserData());
      Gdb = Gdb + parseFloat(app.view.getFigure(parseInt(l)).getUserData().G);
  		gn = Math.pow(10,parseFloat(app.view.getFigure(parseInt(l)).getUserData().G)/10);
  		ip = Math.pow(10,parseFloat(app.view.getFigure(parseInt(l)).getUserData().IP3)/10);
  		p1 = Math.pow(10,parseFloat(app.view.getFigure(parseInt(l)).getUserData().P1db)/10);
  		pmax = parseFloat(app.view.getFigure(parseInt(l)).getUserData().Pmax);
  		if (first == 0) {
  			NF = parseFloat(app.view.getFigure(parseInt(l)).getUserData().NF);
  			F = Math.pow(10,NF/10);
  			first = 1;
  			Glin = Math.pow(10,Gdb/10);
  			IPa = ip;
  			P1a = p1;
  			Pin = parseFloat(rfhCascade.Pin);
  		}
  		else {
  			Fa = Math.pow(10,parseFloat(app.view.getFigure(parseInt(l)).getUserData().NF)/10);
        if(app.view.getFigure(parseInt(l)).getUserData().disabled){
          Fa = 1;
        }
  			F = F + (Fa-1)/Gprev;
  			Glin = Glin*Gprev;
  			IPa = 1/(1/(IPa*gn) + 1/ip); //output IP3
  			P1a = 1/(1/(P1a*gn) + 1/p1); //output P1dB
  			Pin = GprevDB + parseFloat(rfhCascade.Pin);
  		}
  		Gprev = Math.pow(10,Gdb/10);
  		GprevDB = Gdb;
  		Pprev = Pin;
  		NF = 10*Math.log(F)/Math.LN10;
  		IP = 10*Math.log(IPa)/Math.LN10;
  		P1 = 10*Math.log(P1a)/Math.LN10;
  		inP1 = P1 - parseFloat(app.view.getFigure(parseInt(l)).getUserData().G);
  		inIP = IP - parseFloat(app.view.getFigure(parseInt(l)).getUserData().G);
      rfhCascade.dataOutput.push({"name" : app.view.getFigure(parseInt(l)).getChildren().data[0].text,"op1db" : P1,"ip1db" : inP1,"nf" : NF,"oip3" : IP,"iip3" : inIP,"power": Pin});
    }
  });
  partX.push(xtick);
  let results = "RESULTS \n Gain = "+Gdb.toFixed(2)+" dB \n NF = "+NF.toFixed(2)+" dB \n OP1dB = "+P1.toFixed(2)+" dB \n OIP3 = "+IP.toFixed(2)+" dB";
  app.view.getFigure(0).setText(results);
  rfhCascade.plotActive = true;
  plotData('new');
}
function validateInputs(form,callBack) {
	var noErrors = true;
  if ($('#deviceNameInput').val() != originalName){
    if (rfhCascade.nameArray.includes($('#deviceNameInput').val())){
      noErrors = false
      $('#deviceNameInput').focus();
      return;
    }
  }
  if (isNaN($('#deviceGainInput').val())) {
    noErrors = false
    $('#deviceGainInput').focus();
    return;
  }
  if($('#deviceNFInput').val() < 0) {
    noErrors = false
    $('#deviceNFInput').focus();
    return;
  }
  if (isNaN($('#deviceP1Input').val())) {
    noErrors = false
    $('#deviceP1Input').focus();
    return;
  }
  if (isNaN($('#deviceIp3Input').val())) {
    noErrors = false
    $('#deviceIp3Input').focus();
    return;
  }
  if (isNaN($('#devicePsatInput').val())) {
    noErrors = false
    $('#devicePsatInput').focus();
    return;
  }
  if (isNaN($('#devicePmaxInput').val())) {
    noErrors = false
    $('#devicePmaxInput').focus();
    return;
  }
	if (noErrors) {
		callBack();
	}
}
function saveProperties() {
	var device = app.view.getFigure(activeDevice);
	device.setUserData({
    Name:$('#deviceNameInput').val(),
    G:$('#deviceGainInput').val(),
    NF:$('#deviceNFInput').val(),
    P1db:$('#deviceP1Input').val(),
    IP3:$('#deviceIp3Input').val(),
    Psat:$('#devicePsatInput').val(),
    Pmax:$('#devicePmaxInput').val(),
    disabled:$('#disableDeviceCB').prop("checked")
  });
  if($('#disableDeviceCB').prop("checked")){
    device.setBackgroundColor('#888888');
  }
  else{
    device.setBackgroundColor('#ffffff');
  }
  device.getChildren().first().setText($('#deviceNameInput').val());
  $('#partPropsModal').modal('hide');
  let a = alignCascade(app.view.getFigures().data.length-1);
  if (a[0]  == 0) {
    calcCascade(a[1]);
  }
  else {
    console.log('not ready');
  }
}
function saveMainSettings() {
  rfhCascade.Pin = $('#powerInput').val();
  $('#settingsModal').modal('hide');
}
function plotData(action) {
  var param = $('#plotTypeSelect').val();
  if (param == "") {
    param = "op1db";
    document.getElementById('plotTypeSelect').selectedIndex = "0";
  }
  var partX = [], partX2 = [];
	var partNames = [], partData = [], partDataFreeze = [], xWidth, xTickSize;
  console.log(rfhCascade.dataOutput);
  rfhCascade.dataOutput.forEach(function(dataOut) {
    partNames.push(dataOut.name);
    partData.push(dataOut[param]);
  });
  let j=0;
  partNames.forEach(function(partName) {
    j = j+100;
    partX.push(j);
  });
	if (rfhCascade.plotFrozen) {
		for (let i=0;i<rfhCascade.dataOutputFreeze.length;i++) {
			partDataFreeze.push(rfhCascade.dataOutputFreeze[i][param]);
      var trace1 = {x:partNames,y:partDataFreeze};
		}
  }
  var trace2 = {x:partNames,y:partData};

  var data = rfhCascade.plotFrozen ? [trace1,trace2]:[trace2];
  var layout = {
    title: 'Cascade',
    xaxis: {
      title: 'Part',
      titlefont: {
        family: 'Courier New, monospace',
        size: 18,
        color: '#7f7f7f',
        showlines: true,
        zeroline: true
      }
    },
    yaxis: {
      title: $( "#plotTypeSelect option:selected" ).text(),
      titlefont: {
        family: 'Courier New, monospace',
        size: 18,
        color: '#7f7f7f',
        showlines: true,
        zeroline: true
      }
    }
  };
  if (action == 'new') {
    Plotly.newPlot('dataPlotDiv', data,layout,{displaylogo: false, editable:true, modeBarButtonsToRemove:['sendDataToCloud','pan2d','select2d','lasso2d','hoverClosestCartesian','hoverCompareCartesian','toggleSpikelines']});
    console.log(data);
    rfhCascade.dataOutputFreeze = rfhCascade.dataOutput;
  //  rfhCascade.dataOutput =[];
  }
  if (action == 'update') {
   Plotly.purge('dataPlotDiv');
    console.log(data);
    Plotly.newPlot('dataPlotDiv', data,layout,{displaylogo: false, editable:true,modeBarButtonsToRemove:['sendDataToCloud','pan2d','select2d','lasso2d','hoverClosestCartesian','hoverCompareCartesian','toggleSpikelines']});
  }
}
function plotUpdate() {
  var param = $('#plotTypeSelect').val();
}
function clearPlot() {
  if(rfhCascade.plotFrozen){
  //  Plotly.deleteTraces('dataPlotDiv',1);
  }
  else {
  //  Plotly.deleteTraces('dataPlotDiv',0);
  }
}
function freezePlot() {
	if (!rfhCascade.plotFrozen) {
		rfhCascade.plotFrozen = true;
		rfhCascade.dataOutputFreeze = rfhCascade.dataOutput;
    console.log(rfhCascade.dataOutputFreeze);
	}
	else {
		rfhCascade.plotFrozen = false;
		rfhCascade.dataOutputFreeze = [];
		deleteTrace();
	}
}
function deleteTrace(){
//  Plotly.deleteTraces('dataPlotDiv', 0);
};
function saveFile() {
  let writer = new draw2d.io.json.Writer();
  writer.marshal(app.view, function(json){
  let jsonTxt = JSON.stringify(json,null,2);
  let filename = dialog.showSaveDialogSync(null);
 	if (filename === undefined){
      console.log("You didn't save the file");
      return;
 	}
 	// fileName is a string that contains the path and filename created in the save file dialog.
 	if (filename.substring(filename.length-5,filename.length) != ".json") {
 		filename=filename+".json";
 	}
 	fs.writeFile(filename, jsonTxt, function (err) {
     if(err){
      	console.log("alert","Design has NOT been saved. An error occurred creating the file "+err.message);
     }
     else {
     		console.log("normal","Design has been saved.");
     }
 	});
 });
}
function openFile() {
//  var jsonDocument = $('#jsonText').val();
  //var str = "draw2d.shape.basic.Oval";
  let filename = dialog.showOpenDialogSync();
  let jsonDocument, data;
  console.log(filename[0]);
  if (filename[0] != undefined) {
    data = fs.readFileSync(filename[0],'utf8');
  }
  console.log(data);
  jsonDocument = data;
  app.view.clear();
  var reader = new draw2d.io.json.Reader();
  reader.unmarshal(app.view, jsonDocument);

  connectionList = [];
let idArray = [];
 app.view.getFigures().each(function(i,e) {
   if (e.getId() != 0) {
     var label = new draw2d.shape.basic.Label({text:e.getUserData().Name, color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
     var labelAdd = e.add(label, new draw2d.layout.locator.TopLocator());
     e.getPorts().each(function(ii,ee) {
       //future connections
       ee.on("connect", function(p) {p.setVisible(false)});
       ee.on("disconnect", function(p) {p.setVisible(true)});
       //current connectionList
       ee.getConnections().each(function(ic,ec) {
         ee.setVisible(false);
       });
     });
   }
   if (e.getId() >= 3) {
     idArray.push(e.getId());
     e.on("dblclick",function(){
       activeDevice = e.getId();
       $('#myModalLabel').text(e.getUserData().Name+" Properties")
	       $('#deviceNameInput').val(e.getUserData().Name);
	       $('#deviceGainInput').val(e.getUserData().G);
	       $('#deviceNFInput').val(e.getUserData().NF);
	       $('#deviceP1Input').val(e.getUserData().P1db);
	       $('#deviceIp3Input').val(e.getUserData().IP3);
	       $('#devicePsatInput').val(e.getUserData().Psat);
	       $('#devicePmaxInput').val(e.getUserData().Pmax);
	       $('#partPropsModal').modal('show');
     });
     e.on("click", function() {
       activeDevice = e.getId();
       activeName = e.getChildren().first().text;
       console.log(activeName);
     });
     e.on("removed", function(emitter,event) {
       rfhCascade.nameArray.splice(rfhCascade.nameArray.indexOf(e.getChildren().first().text), 1);
       console.log(rfhCascade.nameArray);
       activeName = "";
     });
     rfhCascade.nameArray.push(e.getChildren().first().text);
     activeName = e.getChildren().first().text;
   }
   if (e.getId() == 1 || e.getId() == 2) {
     e.setDeleteable(false);
   }
 });
 app.view.getLines().each(function(i,e) {
   //Need to create the connectonList array
   connectionList.push(e.getId()+","+e.getSource().getParent().getId() + ","+e.getTarget().getParent().getId());
   e.on("removed", function() {
     let i=0;
     while(i<connectionList.length){
       if(connectionList[i].split(",")[0] == e.getId()){
         connectionList.splice(i,1);
         i = connectionList.length;
       }
       else {
         i++;
       }
       app.view.getFigure(0).setText("RESULTS");
     }
   });

});
    let a = alignCascade(app.view.getFigures().data.length-1);
    if (a[0]  == 0) {
      calcCascade(a[1]);
    }
    else {
      console.log('not ready');
    }
    console.log(rfhCascade.nameArray);
   partID = Math.max(...idArray)+1;
}
