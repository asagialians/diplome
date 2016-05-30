(function(){
    function makeUid(length){
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < length; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }

  var dispatcher = window.dispatcher;
  var dataContainer = new DataContainer({dispatcher: dispatcher});

  var Opener = React.createClass({
    open: function (e){
      dataContainer.parseFile(e.currentTarget.files[0]);
    },
    render: function (){
      return (<input type="file" name="file" onChange={this.open}/>);
    }
  });

  var StatsSelector = React.createClass({
    render: function (){
      return (
        <select onChange={this.select}>
          <option value="">Выберите...</option>
          <option value="BySector">Контракты по отраслям</option>
        </select>
      );
    },
    select: function(e){
      var val = e.currentTarget.value;
      if(val){
        currentChartType = val;
        var data = dataContainer.getStats(currentChartType);
        dispatcher.trigger('openchart:pie', data);
      }
    }
  });

  var ContractRow = React.createClass({
    render: function(){
      var key = 0;
      var tds = this.props.data.map(function(column) {
        return (<td key={key++}>{column}</td>);
      });

      return (
      <tr>
        {tds}
      </tr>);
    }
  });

var Example = React.createClass({
  displayName: 'Example',

  getInitialState: function() {
    return {
      startDate: moment()
    };
  },
  handleChange: function(date) {
    this.setState({
      startDate: date
    });
  },
  render: function() {
    return <DatePicker
        dateFormat="YYYY-MM-DD"
        selected={this.state.startDate}
        onChange={this.handleChange} />;
  }
});

  var Dates = React.createClass({
    render: function(){
      return (
        <div className="form-group">
          <DatePicker
              dateFormat="YYYY-MM-DD"
              selected={this.state.startDate}
              onChange={this.handleDateFromChange} />
          -
          <DatePicker
              dateFormat="YYYY-MM-DD"
              selected={this.state.finishDate}
              onChange={this.handleDateToChange} />
        </div>);
    },
    componentDidMount: function(){
        var self = this;
        dispatcher.on('change:dates', function(dates){
            self.setState({
                startDate: moment(dates.from, "YYYY-MM-DD"),
                finishDate: moment(dates.to, "YYYY-MM-DD")
            });
        });
    },
    getInitialState: function(){
      return {
        startDate: moment(this.props.dateFrom, "YYYY-MM-DD"),
        finishDate: moment(this.props.dateTo, "YYYY-MM-DD")
      };
    },
    handleDateFromChange: function(date){
      this.setState({startDate: date});
      this.changeChart();
    },
    handleDateToChange: function(date){
      this.setState({finishDate: date});
      this.changeChart();
    },
    changeChart: function(){
      clearTimeout(this._timeout);
      var self = this;

      this._timeout = setTimeout(function(){
        dispatcher.trigger('change:dates', {
          from: self.state.startDate.format('YYYY-MM-DD'),
          to: self.state.finishDate.format('YYYY-MM-DD')
        });
      }, 1000);
    }
  });

  var ContractsTable = React.createClass({
    render: function(){
      var items = this.renderItems();
      var header = this.renderHeader();
      return (
        <table className="table">
          <thead>{header}</thead>
          <tbody>{items}</tbody>
        </table>);
    },
    renderItems: function(){
      var key = 0;
      return this.props.data.map(function(row) {
        key++;
        return (
          <ContractRow data={row} key={key}></ContractRow>
        );
      });
    },
    renderHeader: function(){
      var key = 0
      var ths = this.props.header.map(function(title) {
        return (
          <th key={key++}>{title}:{key-1}</th>
        );
      });
      return (<tr>{ths}</tr>);
    }
  });

  var ColumnChart = React.createClass({
      render: function(){
          this.id = makeUid(5);
          return <div id={this.id}></div>
      },
      setData: function(data){
          this._chart.series[0].setData(data);
      },
      renderBarChart: function(){
          this._chart = new Highcharts.Chart({
              chart: {
                  renderTo: this.id,
                  type: 'column',
                  panning: true,
              },
              title: {
                  text: this.props.title
              },
              plotOptions: {
                  series: {
                      cursor: 'pointer',
                      point: {
                          events: {
                              click: function() {
                                  var date = moment(this.name, 'MMMM YYYY');
                                  var dates = {
                                      from: date.format('YYYY-MM-DD'),
                                      to: date.add(1, 'months').subtract(1, 'days').format('YYYY-MM-DD')
                                  };
                                  dispatcher.trigger('change:dates', dates);
                              }
                          }
                      }
                  }
              },
              data: {
                  rows: this.props.rows
              }
          });
      },
      componentDidMount: function(){
        this.renderBarChart();
      }
  });

  var PieChart = React.createClass({
      render: function(){
          this.id = makeUid(5);
          return <div id={this.id}></div>
      },
      setData: function(data){
          this._chart.series[0].setData(data);
      },
      renderBarChart: function(){
           this._chart  = new Highcharts.Chart({
              chart: {
                  renderTo: this.id,
                  plotBackgroundColor: null,
                  plotBorderWidth: null,
                  plotShadow: false,
                  type: 'pie'
              },
              legend: {
                  align: 'right',
                  verticalAlign: 'top',
                  layout: 'vertical',
                  x: 0,
                  y: 100
              },
              title: {
                  text: this.props.title
              },
              tooltip: {
                  pointFormat: '{series.name}: <b>{point.y}</b>'
              },
              plotOptions: {
                  pie: {
                      allowPointSelect: true,
                      cursor: 'pointer',
                      dataLabels: {
                          enabled: false
                      },
                      showInLegend: true
                  }
              },
              series: [{
                  name: 'Контрактов',
                  colorByPoint: true,
                  data:  this.props.data
              }]
          });
      },
      componentDidMount: function(){
        this.renderBarChart();

        dispatcher.on('');
      }
  });

  var Performers = React.createClass({
     render: function(){
         var options = this.state.items.map(function(item){
             return <option key={makeUid(5)} value={item.id}>{item.name}</option>
         });

         options.unshift(<option key={makeUid(5)} value="all">Все</option>);

         return (
            <div className="form-group">
                <select value={this.state.value} className="form-control" onChange={this.onChange}>
                    {options}
                </select>
            </div>);
     },
     getInitialState: function(){
       return {
         items: this.props.items
       };
     },
     onChange: function(e){
         this.setState({value: e.target.value});
         dispatcher.trigger('change:performer', e.target.value);
     }
  });

  var Radio = React.createClass({
     render: function(){
         var inputs = [];

         for(var i in this.props.items){
             inputs.push(
                 <label key={makeUid(5)}>
                    {this.props.items[i]}
                    <input checked={(i === this.state.value)} onChange={this.handleChange} type="radio" name={this.props.name} value={i}/>
                </label>);
         }

         return (
             <div className="form-group">
                {inputs}
             </div>);
     },
     handleChange: function(e){
         app.options.byPrice = (e.target.value === 'sum');
         this.setState({value: e.target.value});
         dispatcher.trigger('change:options', app.options);
     },
     getInitialState: function(){
         return {
             value: this.props.value
         }
     }
  });

  var Filters =  React.createClass({
      render: function(){
          var modes = {
              'count':'Количество контрактов',
              'sum':'Сумма контрактов'
          };

          return (
              <form>
                <Dates dateFrom={this.props.dateFrom} dateTo={this.props.dateTo}></Dates>
                <Performers items={this.props.performers}></Performers>
                <Radio name="mode" items={modes} value="count"></Radio>
              </form>);
      }
  });

  var Brief = React.createClass({
     render: function(){
         var items = this.props.items.map(function(item){
             return (<li key={makeUid(5)}>{item.name}: {item.value}</li>);
         });

         return (
             <ul>
                {items}
             </ul>);
     }
  });

  ReactDOM.render(<Opener></Opener>, document.getElementById('example'));

  dataContainer.on('parse:complete', function(data, header){
      dispatcher.trigger('app:start');
  });

  var app = {
      options:{
          byPrice: false
      }
  };

  dispatcher.on('app:start', function(){
      //краткая сводка
      var briefData = dataContainer.getBrief();
      var brief = [];
      console.log(briefData);
      for(var i in briefData){
          brief.push({name: i, value: briefData[i]});
      }

      ReactDOM.render(<Brief items={brief}></Brief>, document.getElementById('example'));
      //исполнители контрактов и количества этих самых контрактов. col72 - это колонка "Поставщик контракта"
      var performers = dataContainer.select("SELECT `INN` AS `id`, FIRST(col72) AS `name`, COUNT(*) as `contracts` FROM ? WHERE `INN`<>'' GROUP BY `INN`");
      var dates = dataContainer.select("SELECT MAX(contract_date) AS maxd, MIN(contract_date) AS mind FROM ? WHERE contract_date > 0");

      var dateTo = new Date(dates[0].maxd).toISOString().substr(0,10),
          dateFrom = new Date(dates[0].mind).toISOString().substr(0,10);

      ReactDOM.render(<Filters dateFrom={dateFrom} dateTo={dateTo} performers={performers}></Filters>, document.getElementById('chart-options'));

      var contractsBySectorCount = dataContainer.getStats('BySector', app.options);
      var pie = ReactDOM.render(<PieChart title="Количество заключенных контрактов по отраслям" data={contractsBySectorCount}></PieChart>, document.getElementById('chart'));
      //контрактов по месяцам
      var contractsCountData = dataContainer.getStats('ByMonths', app.options);
          contractsCountData.unshift([null, 'Contracts']);//заголовок
      var chart = ReactDOM.render(<ColumnChart title="Контрактов по месяцам" rows={contractsCountData}></ColumnChart>, document.getElementById('test'));

      dispatcher.on('change:dates', function(dates){
          app.options.from = dates.from;
          app.options.to = dates.to;

          var data = dataContainer.getStats('BySector', app.options);
          pie.setData(data);
      });

      dispatcher.on('change:performer', function(performerInn){
          app.options.INN = performerInn;

          var data = dataContainer.getStats('ByMonths', app.options);
          chart.setData(data);
      });

      dispatcher.on('change:options', function(options){
          var data = dataContainer.getStats('ByMonths', options);
          chart.setData(data);

          var data = dataContainer.getStats('BySector', options);
          pie.setData(data);
      });
  });
})();
