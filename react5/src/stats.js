(function(w) {
    alasql.fn.ym = function(date){
        if(!date) return null;
        return moment(date).format('YYYY-MM');
    };

    var DataContainer = w.DataContainer = function(options) {
        options || (options = {});

        this._ds = options.dispatcher;
    };

    DataContainer.prototype = observable({
        parseFile: function(file) {
            var self = this;
            this.trigger('parse:start');
            Papa.parse(file, {
                skipEmptyLines: true,
                header: false,
                complete: function(results, file) {
                    self._parse(results);
                }
            });
        },
        _parse: function(rows) {
            var header = rows.data.shift();

            this._data = rows.data.map(function(row) {
                var rowObj = {};
                for (var i in row) {
                    rowObj['col' + i] = row[i];
                }
                //дата подписания контракта - 63 столбец
                //парсим дату в timestamp
                rowObj.contract_date = rowObj.col63 ? Date.parse(rowObj.col63.split('.').reverse().join('-')) : null;
                rowObj.contractDate = new Date(rowObj.contract_date);
                rowObj.INN = rowObj.col73;
                rowObj.contract_price = parseFloat(rowObj.col69.replace(' ','').replace(',','.'));

                return rowObj;
            });

            console.log(this._data[0]);

            this.trigger('parse:complete', this._data, header);
        },
        getStats: function(statName, options) {
            var call = '_stats' + statName;
            if (this[call]) {
                return this[call](options);
            }else{
                console.warn('There is no "'+statName+'" stats;');
            }
            return [];
        },
        map: function(callback) {
            return this._data.map(callback);
        },
        reduce: function(callback, initial) {
            return this._data.reduce(callback, initial);
        },
        forEach: function(callback) {
            return this._data.forEach(callback);
        },
        select: function(query) {
            //console.log(query);
            var res = alasql(query, [this._data]);
            //console.log(res);
            return res;
        },
        //краткая сводка
        getBrief: function(){
            var briefData = {};
            //все контракты
            var briefTotals = this.select("SELECT COUNT(*) as `total_count`, SUM(contract_price) AS total_price FROM ?")[0];
            briefData['Всего контрактов'] = briefTotals.total_count;
            //briefData['Общая сумма всех контрактов'] = briefTotals.total_price;
            //подписанные контракты
            var briefUnsigned = this.select("SELECT COUNT(*) as `signed_count`, SUM(contract_price) AS signed_price FROM ? WHERE contract_date > 0")[0];
            briefData['Подписанных контрактов'] = briefUnsigned.signed_count;
            briefData['Общая сумма подписанных контрактов'] = briefUnsigned.signed_price;

            return briefData;
        },
        //статистика по количеству заключенных контрактов, разбитых по отраслям
        _statsBySector: function(options) {
            options || (options = {});
            var where = ['(contract_date > 0)'];

            var from = Date.parse(options.from);
            var to = Date.parse(options.to);
            var inn = options.INN;

            if (from && to) {
                where.push("(contract_date BETWEEN '" + from + "' AND '" + to + "')");
            }

            if(inn && inn!='all'){
                where.push("(`INN` = '" + inn + "')");
            }

            var whereStr = (where.length > 0 ? 'WHERE ' + where.join(' AND ') : '');

            var y = options.byPrice ? 'SUM(contract_price)' : 'COUNT(*)';

            var res = this.select("SELECT col18 AS name, " + y + " AS y FROM ? " + whereStr + " GROUP BY col18");
            return res;
        },
        //статистика контрактов по месяцам
        _statsByMonths: function(options){
            options || (options = {});
            var where = ['(contract_date > 0)'];

            if(options.INN && options.INN != 'all'){
                where.push("(`INN` = '" + options.INN + "')");
            }

            var y = options.byPrice ? 'SUM(contract_price)' : 'COUNT(*)';

            var whereStr = (where.length > 0 ? 'WHERE ' + where.join(' AND ') : '');
            var res = this.select("SELECT FIRST(contractDate) AS `date`, " + y + " AS `y` FROM ? " + whereStr + " GROUP BY ym(contractDate) ORDER BY date");

            //TODO: нужно напихать нулевых значений между месяцами, и тогда график будет отображаться правильно
            res = res.map(function(item){
                    return [moment(item.date).format('MMMM, YYYY'), parseInt(item.y)];
                });

            return res;
        }
    });
})(this);
