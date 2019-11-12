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
  var str = "draw2d.shape.basic.Oval";
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
    let a = alignCascade(app.view.getFigures().data.length-1);
    if (a[0]  == 0) {
      calcCascade(a[1]);
    }
    else {
      console.log('not ready');
    }
    console.log(idArray);
   partID = Math.max(...idArray)+1;
}
