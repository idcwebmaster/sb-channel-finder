YUI.add("sb-channel-finder", function (Y) {
  "use strict";  
  var nameSelected = [];
  var filterSearch    = Y.one('#search-channel'),
      viewAllBox  = Y.one('div.search-field input[type=button]'),
      searchBoxArea   = Y.one('div.search-field input[type=text]');
  
  Y.SbChannelFinder = Y.Base.create("sb-channel-finder", Y.Widget, [], {
    initializer: function () {
      // publish any events
      // do any instantiation that doesn't require DOM
    },
    renderUI: function () {
      // create all DOM nodes
      var title = Y.Node.create("<div></div>"),
          button = Y.Node.create("<div></div>");
      
      // use this.getClassName(arg1s...) to create unque classes
      title.addClass(this.getClassName("title"));
      button.addClass(this.getClassName("button"));

      // add nodes to the page all at once
      this.get("contentBox").append(Y.all([title, button]));
      
      // store shortcuts for DOM you'll need to reference
      this._titleNode = title;
      this._buttonNode = button;
      
    },
    bindUI: function () {
      // store references to event handlers you set on other
      // objects for clean up later
      this._buttonClickHandler = this._buttonNode.on("click", function (event) {
        Y.log("you clicked the button!");
        event.halt();
      }, this);
      // assign listeners to events on the instance directly
      // they're cleaned up automatically
      this.after("titleChange", this._afterTitleChange, this);
      searchBoxArea.on('click', this._clearSearch, this);
      searchBoxArea.on('keyup', this._searchText, this);
      viewAllBox.on('click', this._viewAll, this);
      Y.on('nameSelectedValue', this._getPollData, this);
      Y.on('viewAll', this._getPollData, this);
    },
    _searchText: function (e){
        var nameSelected = filterSearch.get('value');
        var nameLowerSelected = nameSelected.toLowerCase();
        Y.fire('nameSelectedValue', {nameSelect: nameLowerSelected });

    },
    _viewAll: function (e){
        var nameLowerSelected = 'all';
        Y.fire('viewAll', {nameSelect: nameLowerSelected });
    },
    _afterTitleChange: function (event) {
      this._titleNode.setContent(event.newVal);
    },
    _getPollData : function(e){

        nameSelected = e.nameSelect.toLowerCase();
          console.log('nameSelected::',nameSelected);
    if(nfl.constants.ENV == 'DEV'){
      var pollURL = encodeURI(this.get('pollURL'));

      var xdrConfig = { id:'flash', yid: Y.id, src: nfl.constants.FLASH_PATH + '/flash/yui/io.swf?t=' + new Date().valueOf().toString()};
      Y.io.transport(xdrConfig);
      var cfg = {
          method: "GET",
          xdr: {
            use:'flash' //This is the xdrConfig id we referenced above.
          },
          on: { success: Y.bind(this._pollInfoSuccess, this),
              failure: Y.bind(this._pollInfoError, this)
            }
      };
      pollURL =  pollURL;
      Y.on('io:xdrReady', function() {
        var request = Y.io(pollURL, cfg);
      });

    }else{
      var pollURL = this.get('pollURL');
      var request = Y.io(pollURL, {
            method:"GET",
            on: {
                    success:Y.bind(this._pollInfoSuccess,this),
                    failure:Y.bind(this._pollInfoError,this)
                }
            }
        );
    }
  },   
  _pollInfoError : function(id,o){
    console.log('channel data error');
  },
  _clearSearch : function(e){
    e.preventDefault();
    filterSearch.set('value', '');
  },
  _clearTable: function(){
      Y.one('#channel').replace('<div id="channel"></div>');
      console.log('clear Table');
  },  
  _pollInfoSuccess : function(id,o){

    var columnDef = [
        {
              key  : "Country",
              label: "Country",
              abbr : "country",
              formatter: function (o) {
                  return '<span>'+ o.data.Country +'</span>'
              },
              allowHTML: true,
              sortable: true
          },
          {
              key  : "Channel",
              label: "Channel",
              abbr : "channel",
              formatter: function (o) {
                  return '<span>'+ o.data.Channel +'</span>'
              },
              allowHTML: true,
              sortable: true
          },
      ];
       var listData = [],
           html = '', 
           i;

        // Process the JSON data returned from the server
        try {
            listData = Y.JSON.parse(o.responseText);
        }

        catch (e) {
            alert("JSON Parse failed!");
            return;
        }
        var filteredDataSet = [],
          errormsg = 'No Channel Available';
        Y.Array.filter(listData, function (item,index, arr) {
           //console.log('item',item);
            var searchTerm = nameSelected;
            console.log('searchTerm',searchTerm);
            var filterCountry = ((item.Country) ? item.Country  : '');
            console.log('filterCountry',filterCountry);
            var _filterCountry = (searchTerm == 'all' ? 0 : filterCountry.toLowerCase().indexOf(searchTerm)); 
            console.log('_filterCountry',_filterCountry);
          if(_filterCountry == 0) {
                filteredDataSet.push(item);
          }//else{
            //     filterDataTable.setHTML(errormsg);
            // }
            //console.log(filteredDataSet);
        });

        var tableFilter = new Y.DataTable({
            columns: columnDef, 
            data   : filteredDataSet,
            scrollable: true,
            width: "100%",
            sortBy:  [{Country:'asc' }]
        });
        this._clearTable();
        tableFilter.render('#channel'); 
    console.log('channel data success');
  },
    syncUI: function () {
      // now that the DOM is created, syncUI sets it up
      // given the current state of our ATTRS
      this._afterTitleChange({
        newVal: this.get("title")
      });
       
    },
    destructor: function () {
      if (this.get("rendered")) {
        // bindUI was called, clean up events
        this._buttonClickHandler.detach();
        this._buttonClickHandler = null;
        // renderUI was called, clean up shortcuts
        this._titleNode = this._buttonNode = null;
      }
    }
  }, {
    // Public attributes that broadcast change events
    ATTRS: {
      title: {
        value: "No one gave me a title :("
      },
      pollURL : {
        value:null
      }
    },
    // Attributes whose default values can be scraped from HTML
    HTML_PARSER: {
      title: function (srcNode) {
        return srcNode.getAttribute("title");
      }
    }
  });
  
}, "3.10.0", {
  requires: [
    "base-build", // provides Y.Base.create
    "widget",
    "io",
  "node",
  "event",
  "json-parse",
  "datatype-xml", "dataschema-xml", "event-custom", "datatable", "datatable-sort",    // provides Y.Widget
  ],
  group: "nfl",     // declares the nfl group (important for skins)
  skinnable: false   // declares that your module is skinned
});