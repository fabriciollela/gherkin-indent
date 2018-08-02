var Indent = function(config) {
  this.stepIndent = 4;

  if (config && config.stepIndent) this.stepIndent = config.stepIndent;

  this.originalText = "";
  this.lines = [];
  this.words = {
    feature: ["Feature", "기능"],
    background: ["Background", "배경"],
    scenario: ["Scenario", "시나리오"],
    scenarioOutline: ["Scenario Outline", "시나리오 개요"],
    examples: ["Examples", "예"],
    given: ["Given", "조건", "먼저"],
    when: ["When", "만일", "만약"],
    then: ["Then", "그러면"],
    and: ["And", "그리고"],
    but: ["But", "하지만", "단"]
  };
  this.nonePaddingKeys = ["feature", "scenario", "scenarioOutline"];
  this.leftPaddingKeys = ["example", "given", "when", "then", "and", "but"];

  this.init = function(originalText) {
    this.originalText = originalText;
    this.lines = this.originalText.split(/[\r\n]+/g).map(function(line) {
      return line.trim();
    });
    if (this.lines[this.lines.length - 1].indexOf("|") !== -1)
      this.lines.push(" ");
  };

  this.format = function(originalText) {
    this.init(originalText);
    this.formatSteps();
    this.formatTables();
    return this.lines.join("\r\n");
  };

  this.formatTables = function() {
    var tables = this.extract();
    var formattedTables = [];
    tables.forEach(function(table) {
      var formattedTable = this.formatTableRows(table);
      formattedTable.forEach(function(element) {
        this.lines[element.lineNumber] = this.getPad(3) + element.value;
      }, this);
    }, this);
    return formattedTables;
  };

  this.extract = function() {
    var tables = [];
    var rows = [];
    this.lines.forEach(function(line, index) {
      if (line.indexOf("|") !== -1) {
        rows.push({ value: line, lineNumber: index });
        if (
          index + 1 < this.lines.length &&
          this.lines[index + 1].indexOf("|") === -1
        ) {
          tables.push(rows);
          rows = [];
        }
      }
    }, this);
    return tables;
  };

  this.formatSteps = function() {
    this.lines.forEach(function(line, index) {
      Object.keys(this.words).forEach(function(key) {
        this.words[key].forEach(function(word) {
          if (this.isValidStep(line, word)) {
            if (this.nonePaddingKeys.indexOf(key) > -1) {
              this.lines[index] = line + "\n";
            } else if (this.leftPaddingKeys.indexOf(key) > -1) {
              this.lines[index] = this.getPad(1) + line;
            } else {
              this.lines[index] = "\n" + this.getPad(2) + line;
            }
          } else if (
            line.length > 0 &&
            this.lines[index] === line &&
            this.nonePaddingKeys.indexOf(key) === -1
          ) {
            if (line.indexOf("@") || line.indexOf("#")) {
              this.lines[index] = line + "\n";
            } else {
              this.lines[index] = this.getPad(1) + line + "\n";
            }
          }
        }, this);
      }, this);
    }, this);
  };

  this.isValidStep = function(line, stepName) {
    var pattern = /^[\s\r\t\n]+$/;
    if (line.indexOf(stepName) !== -1) {
      var first = line.substr(0, line.indexOf(stepName));
      if (first.length === 0) return true;
      if (pattern.test(first)) return true;
    }
    return false;
  };

  this.formatTableRows = function(rows) {
    var columns = [],
      indexes = [],
      i,
      j,
      max;
    rows.forEach(function(element, index) {
      if (this.isValidStep(element.value, "|")) {
        var newstrings = element.value.match(/(?=\S)[^\|]+?(?=\s*(\||$))/g);
        newstrings.splice(0, 0, "");
        newstrings.push("");
        columns.push(newstrings);
        indexes.push(index);
      }
    }, this);

    for (i = 0; i < columns[0].length; i++) {
      max = this.longest(i, columns);
      if (max > 0) {
        for (j = 0; j < columns.length; j++) {
          var newValue = this.centerPad(
            columns[j][i],
            max - this.getTextLength(columns[j][i])
          );
          columns[j][i] = newValue;
        }
      }
    }
    for (i = 0; i < indexes.length; i++) {
      rows[indexes[i]].value = columns[i].join("|");
    }
    return rows;
  };

  this.getTextLength = function(text) {
    var tcount = 0;
    var temp = text.length;
    var onechar;
    for (k = 0; k < temp; k++) {
      onechar = text.charAt(k);
      if (escape(onechar).length > 4) {
        tcount += 2;
      } else {
        tcount += 1;
      }
    }
    return tcount;
  };

  this.longest = function(col, elements) {
    var max = this.getTextLength(elements[0][col]);
    for (var i = 1; i < elements.length; i++) {
      if (this.getTextLength(elements[i][col]) > max)
        max = this.getTextLength(elements[i][col]);
    }
    return max;
  };

  this.centerPad = function(str, count) {
    if (count > 0) {
      var start = Math.ceil(count / 2);
      var end = Math.floor(count / 2);
      return Array(start + 1).join(" ") + str + Array(end + 1).join(" ");
    }
    return str;
  };

  this.getPad = function(value) {
    return Array(Math.ceil(this.stepIndent * value)).join(" ");
  };
};

module.exports = Indent;
