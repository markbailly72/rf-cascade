function alignCascade(numParts) {
  let N = connectionList.length;
  let connectCheck = checkInOut();
  let cascadeList = [];
  let error = 0;
  let nextPart = 1;
  if (!connectCheck[0]) {
    error = 1; //no input port
  }
  if (!connectCheck[1]) {
    error = error+2; //no output port
  }
  if (error != 0) {
    return error;
  }
  if (numParts != connectionList.length+1) {
    error = 5; //unconnected part
    return error;
  }
  while (cascadeList.length != numParts-2) {
    for (let i=0;i<connectionList.length;i++) {
        if(connectionList[i].split(",")[1] == nextPart) {
          if (connectionList[i].split(",")[2] != 2) {
            cascadeList.push(connectionList[i].split(",")[2]);
            nextPart = connectionList[i].split(",")[2];
          }
        }
    }
  }
  console.log(cascadeList);

  return [error,cascadeList];
}
function checkInOut() {
  let isConnectedOut = false;
  let isConnectedIn = false;
  let list = [];
  for (let i=0;i<connectionList.length;i++) {
    list.push(connectionList[i].split(",")[1]);
    list.push(connectionList[i].split(",")[2]);
  }
  if (list.includes("1")) {
    isConnectedIn = true;
  }
  if (list.includes("2")) {
    isConnectedOut = true;
  }
  return [isConnectedIn,isConnectedOut];
}
function calcCascade(list) {
  var deviceArray = [];
	var partNames = [],partOP1db = [],partIP1db = [],partNF = [],partIIP3 = [],partOIP3 = [];
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
  for (let i=0;i<list.length;i++) {
    if(!app.view.getFigure(parseInt(list[i])).getUserData().disabled){
      console.log(app.view.getFigure(parseInt(list[i])).getUserData());

      Gdb = Gdb + parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().G);

  		gn = Math.pow(10,parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().G)/10);
  		ip = Math.pow(10,parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().IP3)/10);
  		p1 = Math.pow(10,parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().P1db)/10);
  		pmax = parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().Pmax);
    /*  if(app.view.getFigure(parseInt(list[i])).getUserData().disabled){
        console.log('disabled');
        Gdb = 0;
        ip = 1e10;
        p1 = 1e10;
        pmax = 1e10;
      }*/
  		if (first == 0) {
  			NF = parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().NF);
      /*  if(app.view.getFigure(parseInt(list[i])).getUserData().disabled){
          NF = 0;
        }*/
  			F = Math.pow(10,NF/10);
  			first = 1;
  			Glin = Math.pow(10,Gdb/10);
  			IPa = ip;
  			P1a = p1;
  			Pin = parseFloat(rfhCascade.Pin);
  		}
  		else {
  			Fa = Math.pow(10,parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().NF)/10);
        if(app.view.getFigure(parseInt(list[i])).getUserData().disabled){
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
  		inP1 = P1 - parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().G);
  		inIP = IP - parseFloat(app.view.getFigure(parseInt(list[i])).getUserData().G);
      partNames.push(app.view.getFigure(parseInt(list[i])).getChildren().data[0].text);
  		partOP1db.push(P1);
  		partIP1db.push(inP1);
  		partOIP3.push(IP);
  		partIIP3.push(inIP);
  		partNF.push(NF);
  		partX.push(xtick);
    }
  }
  partX.push(xtick);
  rfhCascade.dataOutput =[];
	for (var i=0; i < partNames.length;i++) {
		rfhCascade.dataOutput.push({"name" : partNames[i],"op1db" : partOP1db[i],"ip1db" : partIP1db[i],"nf" : partNF[i],"oip3" : partOIP3[i],"iip3" : partIIP3[i],});
		console.log(rfhCascade.dataOutput[i]);
	}
  console.log(Gdb+" "+NF+" "+P1+" "+IP);
  let results = "RESULTS \n Gain = "+Gdb.toFixed(2)+" dB \n NF = "+NF.toFixed(2)+" dB \n OP1dB = "+P1.toFixed(2)+" dB \n OIP3 = "+IP.toFixed(2)+" dB";
  app.view.getFigure(0).setText(results);
  rfhCascade.plotActive = true;
  plotData('new');
}
function validateInputs(form,callBack) {
	var noErrors = true;
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
    console.log('ready to calculate');
    calcCascade(a[1]);
  }
  else {
    console.log('not ready');
  }
}
function plotData(action) {
  console.log(rfhCascade.plotFrozen);
  var param = $('#plotTypeSelect').val();
  if (param == "") {
    param = "op1db";
    document.getElementById('plotTypeSelect').selectedIndex = "0";
  }
  var partX = [], partX2 = [];
	var partNames = [], partData = [], partDataFreeze = [], xWidth, xTickSize;
	for (var i=0;i<rfhCascade.dataOutput.length;i++) {
		partNames.push(rfhCascade.dataOutput[i].name);
	}
	for (var i=0;i<rfhCascade.dataOutput.length;i++) {
		partData.push(rfhCascade.dataOutput[i][param]);
	}
	for (var j=0;j<partNames.length;j++) {
		partX.push(j*100);
	}
	if (rfhCascade.plotFrozen) {
		for (let i=0;i<rfhCascade.dataOutputFreeze.length;i++) {
			partDataFreeze.push(rfhCascade.dataOutputFreeze[i][param]);
      var trace1 = {x:partNames,y:partDataFreeze};
      console.log(trace1);
		}
  }
var trace2 = {x:partNames,y:partData};

var data = rfhCascade.plotFrozen ? [trace1,trace2]:[trace2];
var layout = {
  title: 'Plot Title',
  xaxis: {
    title: 'Part',
    titlefont: {
      family: 'Courier New, monospace',
      size: 18,
      color: '#7f7f7f'
    }
  },
  yaxis: {
    title: $( "#plotTypeSelect option:selected" ).text(),
    titlefont: {
      family: 'Courier New, monospace',
      size: 18,
      color: '#7f7f7f'
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
/*remove buttons on displayModeBar
Plotly.newPlot('myDiv', data, layout, {modeBarButtonsToRemove: ['toImage']});
Plotly.newPlot('myDiv', data, layout, {displaylogo: false});
Plotly.newPlot('myDiv', data, layout, {editable: true});
*/
}
function plotUpdate() {
  var param = $('#plotTypeSelect').val();
}
function clearPlot() {
  if(rfhCascade.plotFrozen){
    Plotly.deleteTraces('dataPlotDiv',1);
  }
  else {
    Plotly.deleteTraces('dataPlotDiv',0);
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
  Plotly.deleteTraces('dataPlotDiv', 0);
};
function savePlotSettings() {
	$('#myModal04').modal('hide');
	d3.select('#plotTitle').text(d3.select('#plotTitleInput').property('value'));
	d3.select('#plotYAxesText').text(d3.select('#yAxisLabelInput').property('value'));
	d3.select('#plotXAxesText').text(d3.select('#xAxisLabelInput').property('value'));
	d3.select('#plotLine').attr('stroke',d3.select('#plotPallete1').attr('value'));
	if (pmtCascade.domMin != d3.select('#yAxisMinInput').property('value') || pmtCascade.domMax != d3.select('#yAxisMaxInput').property('value')) {
		plotData('updateY');
	}
	console.log(d3.select('#plotPallete1').attr('value'));
}
function saveFile() {
  var writer = new draw2d.io.json.Writer();
  writer.marshal(app.view, function(json){
   var jsonTxt = JSON.stringify(json,null,2);

   console.log(jsonTxt);
   $("#jsonText").val(jsonTxt);

 });
}
function openFile() {
  var jsonDocument = $('#jsonText').val();
  console.log(jsonDocument);
  app.view.clear();
  var reader = new draw2d.io.json.Reader();
  reader.unmarshal(app.view, jsonDocument);
  connectionList = [];
 app.view.getFigures().each(function(i,e) {
   if (e.getId() != 0) {
     var label = new draw2d.shape.basic.Label({text:e.getUserData().Name, color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
     var labelAdd = e.add(label, new draw2d.layout.locator.CenterLocator());
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
     }
   });
});
   console.log(app.view.getFigures().data.length-1);
    let a = alignCascade(app.view.getFigures().data.length-1);
    if (a[0]  == 0) {
      console.log('ready to calculate');
      calcCascade(a[1]);
    }
    else {
      console.log('not ready');
    }
}
function saveMainSettings() {
  rfhCascade.Pin = $('#powerSettingsInput').val();
  rfhCascade.Fc = $('#freqSettingsInput').val();
  rfhCascade.BW = $('#bandwidthSettingsInput').val();
  $('#settingsModal').modal('hide');
  console.log('saved settings');
}
function openPowerSweepDialog() {
	//jQuery('#pmtErrorMessage2').html('');
	$('#myModal02').modal('show');
}
