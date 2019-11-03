// declare the namespace for this rfh
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

var activeDevice;
var numParts = 0;
var numLines = 0;
var lineID = 1;
var partID = 3;
var lineList = [];
var partList = [];
var connectionList = [];
var cascadeList = [];
var canvas;
var app;
var rfhCascade = {'Pin':-50,
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
                  'dataOutputFreeze':[]
};
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
             app.view.getFigure(0).setText("RESULTS");
           }
           //FIX clearPlot
           clearPlot();
           console.log(connectionList);
         });
         connection.on('added', function(){
           connectionList.push(connection.getId()+","+connection.getSource().getParent().getId() + ","+connection.getTarget().getParent().getId());
         });
         connection.on("added",function(){
           let a = alignCascade(connection.canvas.getFigures().data.length-1);
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
$('#savePartPropsButton').on('click',function () { validateInputs('rfhDeviceForm',function() {saveProperties()}) });
$('#saveSettingsButton').on('click',function () {saveMainSettings()});
$('#plotTypeSelect').on('change',function () {plotData('update')});
//$('#rfhButtonPlotSettings').on('click',function () {$('#plotSettingsModal').modal('show')});
$('#rfhButtonMainSettings').on('click',function () {
  $('#powerSettingsInput').val(rfhCascade.Pin);
  $('#freqSettingsInput').val(rfhCascade.Fc);
  $('#bandwidthSettingsInput').val(rfhCascade.BW);
  $('#settingsModal').modal('show');
});
//$('#rfhButtonFreezePlot').on('click', function() {rfhCascade.plotFrozen = !rfhCascade.plotFrozen});
 $('#rfhButtonSaveFile').on('click', function() {saveFile()});
 $('#rfhButtonOpenFile').on('click', function() {openFile()});
 $('#rfhButtonPowerSweep').on('click',function () { openPowerSweepDialog() });
 //$('#rfhButtonPowerSweepGo').on('click',function () { validateInputs('pmtPowerSweepForm',function() {powerSweep()}) });

//  var figure =  new draw2d.shape.node.Start({id:1,color: "#3d3d3d"});
var figure =  new draw2d.shape.node.Start({id:1,color: "#3d3d3d"});
  var label = new draw2d.shape.basic.Label({text:"Input", color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
  var labelAdd = figure.add(label, new draw2d.layout.locator.CenterLocator());
  figure.setDeleteable(false);
  figure.getPort("output0").on("connect", function(p) {p.setVisible(false)});
  figure.getPort("output0").on("disconnect", function(p) {p.setVisible(true)});
  figure.setUserData({Name:"Input"});
  app.view.add(figure,100,100);

  figure =  new draw2d.shape.node.End({id:2,color: "#3d3d3d"});
  label = new draw2d.shape.basic.Label({text:"Output", color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
  figure.add(label, new draw2d.layout.locator.CenterLocator(figure));
  figure.setDeleteable(false);
  figure.getPort("input0").on("connect", function(p) {p.setVisible(false)});
  figure.getPort("input0").on("disconnect", function(p) {p.setVisible(true)});
  figure.setUserData({Name:"Output"});
  app.view.add(figure,500,100);

  var msg = new draw2d.shape.note.PostIt({id:0,text:"RESULTS", x:400, y:100});
  msg.setDeleteable(false);
  app.view.add(msg,600,100);
  // let settingsText = "Settings:\nPin = "+rfhCascade.Pin+" dbm \nF = "+rfhCascade.Fc+" "+rfhCascade.Funits+"\nBW = "+rfhCascade.BW+" "+rfhCascade.Funits;
  // var msg = new draw2d.shape.note.PostIt({text:settingsText, x:0, y:0});
  // msg.on("dblclick",function () {$('#settingsModal').modal('show');});
  // msg.setDeleteable(false);
  // app.view.add(msg,0,0);
});
