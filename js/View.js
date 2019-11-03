
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
			var figure = new draw2d.shape.node.Between({id:partID});
		//var figure = new draw2d.shape.analog.OpAmp({id:partID})
			var label = new draw2d.shape.basic.Label({text:"Part"+partID, color:"#0d0d0d", fontColor:"#0d0d0d",stroke:0});
		  figure.add(label, new draw2d.layout.locator.CenterLocator(figure));
			figure.setUserData({Name:"Part"+partID,G:10,NF:3,P1db:20,IP3:30,Psat:22,Pmax:10,disabled:false});
			figure.setWidth(100);
			figure.setResizeable(false);
			figure.setBackgroundColor('#ffffff');
			figure.getPort("input0").on("connect", function(p) {p.setVisible(false)});
		  figure.getPort("input0").on("disconnect", function(p) {p.setVisible(true)});
			figure.getPort("output0").on("connect", function(p) {p.setVisible(false)});
		  figure.getPort("output0").on("disconnect", function(p) {p.setVisible(true)});
			figure.on("dblclick", function() {
				activeDevice = figure.getId();
	      console.log(figure.getChildren().first().text);
	      $('#myModalLabel03').text(figure.getUserData().Name+" Properties")
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
		  app.view.add(figure,x,y);
			partID++;
    }
});
