

var baseUrl = "https://creatorci.eu.zmags.com/",
    paramSkip = 0,
    paramNumBuilds = 24,
    // url = "https://creatorci.eu.zmags.com/job/mosaik-master-functionaltests/135/api/json?tree=*,subBuilds[*]&depth=1",
    // url = "https://creatorci.eu.zmags.com/job/mosaik-master-functionaltests/api/json?tree=allBuilds[*,subBuilds[*]]{0,20}&depth=1",

    // to get build (master/branch): https://creatorci.eu.zmags.com/job/mosaik-master-functionaltests/api/json?tree=allBuilds[actions[parameters[*]]]{21,22}&depth=1&pretty
    url = "https://creatorci.eu.zmags.com/job/mosaik-master-functionaltests/api/json?tree=allBuilds[*,subBuilds[*],actions[parameters[*],causes[*]]]{" +
                paramSkip + "," + paramNumBuilds + "}&depth=1",
    token = "cG9oOjhhYWUwNTc3MTQ4NzI0ZGMwZjBlYTdmNTE3MjU5YzMy";

mainAjaxDat(url);

// main table BEGIN
// mainAjaxDat(url).mainAjaxDef(main) renders the main table

function mainAjaxDat(url) {
    // var out;
    $.ajax({
        url: url,
        dataType: "json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + token);
            xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        }
    })
    .done(mainAjaxDef);
}

function mainAjaxDef (data){

    // set table header
    var table = document.getElementById('table');
    var tableRow = table.insertRow(0);

    var tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "TC Build";

    tableRow = table.insertRow(1);
    tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "Duration";

    tableRow = table.insertRow(2);
    tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "Timestamp";

    tableRow = table.insertRow(3);
    tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "Branch";

    tableRow = table.insertRow(4);
    tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "Started by";

    tableRow = table.insertRow(5);
    tableCell = tableRow.insertCell(0);
    tableCell.innerHTML = "Review";



    // iterate over builds
    for (var j = 0; j < data.allBuilds.length; j++) {
    	buildData = data.allBuilds[j];

        ///////////////////////////////////
        // row 0: build number

        var cell = table.rows[0].insertCell(-1);
        cell.innerHTML = "<a href='" + buildData.url + "' target='_blank'>" + buildData.displayName + "</a>";
        if (paramNumBuilds <= 25) {
               cell.innerHTML = cell.innerHTML.concat("<a class=buildserverlink id=" + buildData.displayName +" onclick='buildServerColumn(this.parentNode.cellIndex)'><img src='img/letter_s.png' /></a>");
            }
        switch (buildData.result) {
    			case "SUCCESS":
    				tdclass = "success";
    				break;
    			case "UNSTABLE":
    				tdclass = "fail";
    				break;
    			default:
                    if (buildData.building == true) {
                        tdclass = "building";
                    } else {
                        tdclass = "unknown";
                    }
    				break;
            }
        cell.setAttribute('class',tdclass);

        ///////////////////////////////////
        // row 1: duration

        cell = table.rows[1].insertCell(-1);
        dur = new Date(buildData.duration);
        if (buildData.building) {
            cell.innerHTML = "building";
        } else {
            var durString = (dur.getHours()+(dur.getTimezoneOffset()/60)) + ":" + ("00" + dur.getMinutes()).substr(-2,2) + ":" + ("00" + dur.getSeconds()).substr(-2,2);
            if (paramNumBuilds <= 25) {
                cell.innerHTML = durString;
            } else {
                cell.innerHTML = '*';
                cell.className = 'ellipsis';
                cell.title = durString;
            }
        }

        ///////////////////////////////////
        // row 2: timestamp

        cell = table.rows[2].insertCell(-1);
        cell.title = new Date(buildData.timestamp);
        var dateString = new Date(buildData.timestamp).toString().split(" ")[4];
        if (paramNumBuilds <= 25) {
            cell.innerHTML = dateString;
        } else {
            cell.innerHTML = '*';
            cell.className = 'ellipsis';
        }

        ///////////////////////////////////
        // row 3: branch built

        cell = table.rows[3].insertCell(-1);

        // find the unique branchString: buildData.actions[x].parameters[x] = {name="BUILD", value=branchString}, default to '<i>default</i>'
        var branchString = 'noBranch';
        var actions = buildData.actions;
        var parameters = [];

        /*
         * alternative solution for code below
        for (var i = 0; i < actions.length; i++) {
            if (actions[i].parameters) {
                parameters = actions[i].parameters;
                break;
            }
        }
         for (var i = 0; i < parameters.length; i++) {
            if (parameters[i].name === "BUILD") {
                branchString = parameters[i].value;
                break;
            }
        }
        */

        parameters = actions.reduce(function(result, a) {
            return a.parameters ? a.parameters : result;
        }, null);

        branchString = parameters.reduce(function (result, p) {
            return p.name === "BUILD" ? p.value : result;
        }, null);

        if (branchString === ''){
            branchString = 'Akamai' ;
        }

        if (paramNumBuilds <= 25) {
            cell.innerHTML = branchString;
        } else {
            cell.innerHTML = (branchString=='Akamai')?'A':'*';
            cell.className = 'ellipsis';
            cell.title = branchString;
        }

        ///////////////////////////////////
        // row 4: started by

        cell = table.rows[4].insertCell(-1);

        // find the unique causes: buildData.actions[x].causes[x] = {shortDescription="Started by .*"}

        /*
         * alternative solution for code below
            var causes = buildData.actions.reduce(function (result, c) {
            if (c.causes) {
                result.push(c.causes)
                //code
            }
            return c.causes ? result.push(c.causes) : result;
        }, []);
        */

        var causes = buildData.actions.reduce(function (array, action) {
            if (action.causes) {
                array.push(action.causes[0]);
            }

            return array;
        }, []);

        var startedByJSON = causes.find(function (cause) {
            return cause.shortDescription && cause.shortDescription.indexOf("Started by") > -1;
        });

        startedByCellTitle = '';
        if (startedByJSON.shortDescription === "Started by timer") {
            startedBy = "timer";
        } else if (startedByJSON.shortDescription.indexOf("Started by user") === 0) {
            startedBy = startedByJSON.userId;
       } else if (startedByJSON.shortDescription.search("Started by upstream project \"mosaik-master-mb\"") == 0){
            startedBy = "<a href=\"" + baseUrl + startedByJSON.upstreamUrl + startedByJSON.upstreamBuild +"\" id='upstream_build' target='_blank'>" + startedByJSON.upstreamBuild + "</a>";
            getVersionId(cell, startedByJSON.upstreamUrl + startedByJSON.upstreamBuild);
        } else {
            startedBy = "???";
        }

        if (paramNumBuilds <= 25) {
            cell.innerHTML = startedBy;
        } else {
            if (startedBy == 'timer') {
                cell.innerHTML = 'T';
            } else {
                cell.innerHTML = startedBy;
            }
            cell.className = 'ellipsis';
        }

        //cell.title = (cell.title != '')?cell.title:startedBy;
        cell.title = startedBy; // overwritten by getVersionId ajax

        ///////////////////////////////////
        // row 5: select for review

        cell = table.rows[5].insertCell(-1);
        cell.innerHTML = "<input type='checkbox' name='review' class='review' onclick='review();' value=" + buildData.displayName + ">";
        if (paramNumBuilds > 25){
            cell.className = 'ellipsis';
        }

        ///////////////////////////////////
        // row n: subtests
    	for (var i = 0; i < buildData.subBuilds.length; i++) {
    		subBuildData = buildData.subBuilds[i];
    		switch (subBuildData.result) {
    			case "SUCCESS":
    				tdclass = "success";
    				break;
    			case "UNSTABLE":
    				tdclass = "fail";
    				break;
    			default:
    				tdclass = "unknown";
    				break;
            }

            var jobName = subBuildData.jobName,
                url = baseUrl + subBuildData.url + "TestComplete/",
                buildNumber = subBuildData.buildNumber;

            // test introduced to table when found first time
            if (!document.getElementById(jobName)) {

                // $("#table").append("<tr id=" + jobName + ">");
                var row = table.insertRow(-1);
                row.setAttribute('id',jobName);

                // $("#table").append("   <td> " + jobName (+ buildserverlink) + " </td>");
                cell = row.insertCell(0);
                cell.innerHTML = '<a href="' + baseUrl + 'job/' + jobName + '">' + jobName + '</a>';
                if (paramNumBuilds <= 25) {
                    cell.innerHTML = cell.innerHTML.concat("<a class=buildserverlink id=" + jobName +" onclick='buildServerRow(this.parentNode.parentNode)'><img src='img/letter_s.png' /></a>");
                }

                // pad empty cells to the left
                for(var k = table.childNodes[0].cells.length - 2; k > 0; k--) {
                    cell = row.insertCell(1);
                    cell.setAttribute('class',"pending");
                    cell.innerHTML = "n/a";
                }
            } else {
                var row = document.getElementById(jobName);
            }

            cell = row.insertCell(-1);
            cell.setAttribute('class',tdclass);
            cell.innerHTML = "<a href='" + url + "' target='_blank'>" + buildNumber + "</a>";

            // 0-sized link function
            cell.innerHTML = cell.innerHTML.concat("<a class=buildserverlink id=" + subBuildData.url +" onclick='buildServerCell(this, null)'></a>");
        }

        // pad to the right (just this one column)
        for (l = 0; l < table.children.length ; l++) {
            var row = table.children[l];
            if (row.children.length  < table.children[0].children.length) {
                cell = row.insertCell(-1);
                cell.setAttribute('class',"pending");
                cell.innerHTML = "n/a";
            }
        }
    }
};

// reload called from html: reloads main table with skip settings

function reload(url) {
    document.getElementById('table').innerHTML = '';
    paramSkip = parseInt(document.getElementById('skip').value,10);
    paramNumBuilds = parseInt(document.getElementById('num_builds',10).value);
    paramNumBuildsTotal = paramSkip +  paramNumBuilds;
    url = "https://creatorci.eu.zmags.com/job/mosaik-master-functionaltests/api/json?tree=allBuilds[*,subBuilds[*],actions[parameters[*],causes[*]]]{" +
                paramSkip + "," + paramNumBuildsTotal + "}&depth=1",
    mainAjaxDat(url);
    document.getElementById('review').innerHTML = ""; // clear error table
}

// main table END

// errors table BEGIN

var errorH1 = document.createElement("H1");
errorH1.innerHTML = "Errors";

var errorP = document.createElement("P");
errorP.innerHTML = "To use the 'toggle' functionality, you need to be logged in to Jenkins. Use the 'testId' links to get login screen."

var errorTable = document.createElement("table");
errorTable.setAttribute('id','errortest');

var errorRow;

// error table main function BEGIN
// review() triggered by clicking checkbox, recurses makeErrorRow() which uses errorsAjaxDat().done(errorsAjaxDef()) to get data

function review() {
    var cellNo,
        errorCell,
        table = document.getElementById('table'); // main table

    var reviewCont = document.getElementById('review');
    reviewCont.innerHTML = "";  // error main div
    errorTable.innerHTML = "";  // table in div

    var reviewArrayChecked = document.querySelectorAll('.review:checked');
    if (reviewArrayChecked.length > 0) {

        // set up div/table: reviewCont.innerHTML = "<h1>Error</h1><table id='errortest' />";
        reviewCont.appendChild(errorH1);
        reviewCont.appendChild(errorP);
        reviewCont.appendChild(errorTable);

        var errorHeader = errorTable.createTHead();
        var errorHRow = errorHeader.insertRow(0);
        for(i = 0; i < 9; i++) {
            errorHRow.insertCell(i);
        }
        errorHRow.cells[0].innerHTML = "branch";
        errorHRow.cells[1].innerHTML = "date";
        errorHRow.cells[2].innerHTML = "starter";
        errorHRow.cells[3].innerHTML = "startId";
        errorHRow.cells[4].innerHTML = "multiId";
        errorHRow.cells[5].innerHTML = "test";
        errorHRow.cells[6].innerHTML = "testId";
        errorHRow.cells[7].innerHTML = "server";
        errorHRow.cells[8].innerHTML = "toggle";

        var errorTableB = document.createElement("tbody");
        errorTable.appendChild(errorTableB);

        // iterate over tick-selected builds
        for (i = 0; i < reviewArrayChecked.length; i++){

            var failure = false;
            // iterate over tests (in selected builds)
            for (var j=6; j < table.rows.length; j++) {
                cellNo = reviewArrayChecked[i].parentNode.cellIndex;
                cell = table.rows[j].cells[cellNo];
                if (cell.className.includes("fail")) { //  TODO: || cell.className.includes("unknown") but fix colour and timestamp
                    failure = true;
                    url = baseUrl + cell.lastChild.id;

                    makeErrorRow(errorTableB, table, cellNo, j);

                }
            }

            if (!failure) {
                url = baseUrl + "/job/mosaik-master-functionaltests/" + (table.rows[0].cells[cellNo].textContent).substring(1) + "/";
                errorRow = makeErrorRow(errorTableB, table, cellNo, -1);
            }
            //failure = false;
        }
    }

}

function makeErrorRow(errorTableB, table, cellNo, testId) {

    var errorRow = errorTableB.insertRow(0);

    var eCellBuild = errorRow.insertCell(0);
    var eCellTime = errorRow.insertCell(1)
    var eCellStarter = errorRow.insertCell(2);
    var eCellStId = errorRow.insertCell(3);
    var eCellMBuild = errorRow.insertCell(4);
    var eCellTest = errorRow.insertCell(5);
    var eCellTId = errorRow.insertCell(6);
    var eCellBServ = errorRow.insertCell(7);
    var eCellTgl = errorRow.insertCell(8);

    if (testId != -1) {                  // red test
        //errorRow.classList.add("fail");
        errorsAjaxDat(errorRow);
    } else {                            // green builds
        date = new Date(table.rows[2].cells[cellNo].title);
        eCellTime.innerHTML = date.toLocaleDateString("en-US", {month: 'short', day: 'numeric', year: 'numeric'}) + " " + date.toLocaleTimeString("en-US");
        if (table.rows[0].cells[cellNo].classList.contains('unknown')) {
            errorRow.classList.add("unknown");
        } else {
            errorRow.classList.add("success");
        }
    }

    // cell 0: branch name
    eCellBuild.innerHTML = table.rows[3].cells[cellNo].textContent;

    // cell 2+3: starter/id
    if (table.rows[4].cells[cellNo].firstChild.id == "upstream_build") {
        eCellStarter.innerHTML = "SCM"; //not always right: use https://creatorci.eu.zmags.com/job/mosaik-master-mb/3749/api/json?tree=actions[causes[userId,shortDescription]]&pretty
        eCellStId.innerHTML = table.rows[4].cells[cellNo].textContent;
    } else {
        eCellStarter.innerHTML = table.rows[4].cells[cellNo].textContent;
        eCellStId.innerHTML = "";
    }

    // cell 4: test-master-id#
    eCellMBuild.innerHTML = (table.rows[0].cells[cellNo].textContent).substring(1);

    // cell 5-8: failed test info (or 'All')
    if (testId != -1) {   // red test row
        eCellTest.innerHTML = (table.rows[testId].id).substring(10);                                                // cell 5: testname; strip TC_Editor/TC_Viewer
        eCellTId.innerHTML = table.rows[testId].cells[cellNo].childNodes[0].outerHTML;                              // cell 6: subtest-id#
        buildServerCell(table.rows[testId].cells[cellNo].getElementsByClassName("buildserverlink")[0], eCellTgl)    // cell 7-8: build-server + toggle
    } else {               // green build row
        eCellTest.innerHTML = "All"
        eCellTId.innerHTML = ""
    }

    eCellTgl.className = "toggleCell";
    return errorRow;
}

function errorsAjaxDat(errorRow) {
    return  $.ajax({
                        url: url + "TestComplete/api/json?tree=*,reports[*,details[*]]",
                        dataType: "json",
                        row: errorRow,
                        success: function(data) { errorsAjaxDef(data,this.row) },
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + token);
                            xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
                        }

                    })
}
function errorsAjaxDef(data, errorRow) { // console.log("Data: " + data); console.log(data)
                        var subBuildServerJSON = data;
                        errorRow.classList.add("fail");
                        date = new Date(data.reports[0].details.timestamp);
                        date.setHours(date.getHours() -2); // 2h error in timestamp (error in Jenkins/TE integration)
                        errorRow.cells[1].innerHTML = date.toLocaleDateString("en-US", {month: 'short', day: 'numeric', year: 'numeric'}) + " " + date.toLocaleTimeString("en-US");

                        errorRow.cells[7].innerHTML = cleanBuildServerNum(data.reports[0].agent);

                        errorRow.cells[6].firstChild.setAttribute("href", data.reports[0].url);
                        errorRow.cells[6].firstChild.setAttribute("target", "_blank");
}
// error table main function END

// utilities BEGIN

// getVersionId: find the test mosaik-master-functionaltest's sister mosaik-master-deploy (in master build) and parse versionId from consoleText

function getVersionId(cell, masterBuild) {
    $.ajax({
        url: baseUrl + masterBuild + "/api/json?tree=subBuilds[*]&depth=1",
        dataType: "json",
        beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + token);
                xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        }
    })
    .done(function(data) {
        var subBuilds = data.subBuilds;
        var subBuildUrl;
        for(i=0;i<subBuilds.length;i++) {
            if (subBuilds[i].url.indexOf("mosaik-master-deploy") != -1) {
                subBuildUrl = subBuilds[i].url;
                break;
            }
        }
        getVersionIdFromDeployBuild(cell, subBuildUrl);
    })
}

function getVersionIdFromDeployBuild(cell, deployBuild) {
    $.ajax({
        url: baseUrl + deployBuild + "consoleText",
        dataType: "text",
        beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + token);
                xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
        }
    })
    .done(function(data) {
        var searchStringRE = /File key: js\/editor-main\.(.*)\.js/
        match = searchStringRE.exec(data)[1];
        cell.title = match;
    })
}

// cleanBuildServerNum: strips name of test build server of everything but the number, partly known server names, with general default

function cleanBuildServerNum(subBuildServerNum) {
    subBuildServerNum = subBuildServerNum.replace("testcomplete-11.20_","M");  // Minsky's servers -- remove after a while
    subBuildServerNum = subBuildServerNum.replace("testcomplete","TC");
    subBuildServerNum = subBuildServerNum.replace("TestComplete","");         // Firas'/Pavels servers
    subBuildServerNum = subBuildServerNum.replace(/^.{3,}([12345])$/,"?$1");
    return subBuildServerNum
}

// buildServerCell(): buildServerColumn()/Row() iterates over cells (buildServerCell())
// if eCellTgl is not null, it is called from error table function, otherwise from main table function: renders info in both

function buildServerCell(elem, eCellTgl) {
    if (elem !== undefined) {
        url = baseUrl + elem.id;

        $.ajax({
            url: url + "api/json?tree=builtOn,keepLog",
            dataType: "json",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + token);
                xhr.setRequestHeader("Accept-Language", "en-US,en;q=0.5");
            }
        })
        .done(function(data) {
            var subBuildServerJSON = data;
            var subBuildServer = subBuildServerJSON.builtOn;
            var subBuildServerNum = cleanBuildServerNum(subBuildServer);

            elem.setAttribute('href','https://creatorci.eu.zmags.com/computer/' + subBuildServer + '/');
            elem.setAttribute('target','_blank');
            elem.innerHTML = subBuildServerNum;

            // is built being kept?
            var keeping;
            if (subBuildServerJSON.keepLog == true) {
                keeping = "keep";
            } else {
                keeping = "not_keep"
            }
            elem.parentNode.classList.remove("keep","not_keep");
            elem.parentNode.classList.add(keeping);
            if (eCellTgl != null) {
                var keepImg;
                var cn = elem.parentNode.className;
                if (cn.includes("not_keep")) {
                    keepImg = "./img/red_plus.png";
                } else {
                    keepImg = "./img/minus_sign.gif";
                }
                eCellTgl.innerHTML = "<img onclick='toggleLogKeep(\"" + elem.id + "\", " + eCellTgl.parentNode.rowIndex + ");' src='"+keepImg+"' />";
            }
        });
    }
}

function buildServerColumn(col) {
    var table = document.getElementById('table');
    for (var i=6; i < table.rows.length; i++) {
        buildServerCell(table.rows[i].cells[col].getElementsByClassName('buildserverlink')[0], null);
    }
}

function buildServerRow(row) {
    var table = document.getElementById('table');
    for (var i=1; i < row.cells.length; i++) {
        buildServerCell(row.cells[i].getElementsByClassName('buildserverlink')[0], null);
    }

}

// toggleLogKeep(): set 'Keep this forever' in Jenkins
function toggleLogKeep(elemId, eCellTglRef) {
    if (elemId !== undefined) {
        url = baseUrl + elemId;
        elem = document.getElementById(elemId);
        eCellTgl = document.getElementById("errortest").rows[eCellTglRef].getElementsByClassName("toggleCell")[0];
        var wnd = window.open(url + "toggleLogKeep", '_blank');
        wnd.blur();
        setTimeout(function(){ wnd.close() }, 50);
        buildServerCell(elem, eCellTgl);
    }
}

// utilities END
