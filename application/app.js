const fs = require('fs');
const cheerio = require('cheerio'), cheerioTableParser = require('cheerio-tableparser');
const sampleFilePath  = "C:\\Users\\paulr\\Google Drive\\nodeHTML2\\nodeHTML2\\application\\samples\\sample.html";
const sql = require('mssql');
const outputFileProblems = "C:\\Users\\paulr\\Google Drive\\nodeHTML2\\nodeHTML2\\application\\samples\\outputProblems.txt";
const outputFileSurgicalHx = "C:\\Users\\paulr\\Google Drive\\nodeHTML2\\nodeHTML2\\application\\samples\\outputSurgicalHx.txt";
const outputFileVaccine = "C:\\Users\\paulr\\Google Drive\\nodeHTML2\\nodeHTML2\\application\\samples\\outputVaccine.txt";
const outputFilehxPregnancies = "C:\\Users\\paulr\\Google Drive\\nodeHTML2\\nodeHTML2\\application\\samples\\outputHxPregnanices.txt";


// Controls
var debug = 1;
var printDemo;
var printProblems;
var writeProblems;
var printSurgHx ;
var writeSurgHx;
var printVaccine;
var writeVaccine=1;


// File to Parse
var html = fs.readFileSync(sampleFilePath).toString();

// SQL Insert Variables:
var currentDOS;
var currentSection;
var patientID;
var sectionContent;
var sqlEncounterInserts = [];
var sqlDemoInserts = [];
var sqlClinicalInserts = [];

$ = cheerio.load(html);

// Get patient ID:
idLocation = html.indexOf("PATIENTID =");
tickLocation = html.indexOf("'",idLocation+14);
patientID = html.substring(idLocation+11,tickLocation).replace("'","");
if (printDemo)
{           
    console.log('DEMOGRAPHICS-----------------------------');
    console.log('Patient ID: ', patientID);
}

// Get the Chart ID, whatever that is...
chartIdLocation =html.indexOf("CHARTID =");
tickLocation = html.indexOf("'",chartIdLocation+14);
chartID = html.substring(chartIdLocation+11,tickLocation).replace("'","");
if (debug)
{
    console.log('Chart ID: ', chartID);
}

// DEMOGRAPHICS TO ARRAY
const demoHdr =[];
$('.readonlydisplayfieldlabel','.clinicals_patient_chart_pm_demographicshtml_sub').each(function (i, elem) {
    demoHdr[i] = $(this).text().replace('\'', '\'\'');
});
const demoVal = [];
  $('.readonlydisplayfielddata','.clinicals_patient_chart_pm_demographicshtml_sub').each(function (i, elem) {
      demoVal[i] = $(this).text().replace('\'', '\'\'');
  });

  for (var i =0; i<demoHdr.length; i++)
    {   
        sqlDemoInserts[i] = `insert into nodeHTML.demographics_extraction (patientID, chartId, attributeName, attributeValue) values ('${patientID}','${chartID}','${demoHdr[i]}','${demoVal[i]}')`
        if (printDemo)
        {
            console.log(demoHdr[i],': ',demoVal[i]);
        }
    }

// VITALS (HEADER AREA)
//vitals near the header are not contained in any kind of class, just in a table...

// PROBLEMS (HEADER AREA)
ptProblems = []
$('.problemitem','.problemlist').each(function (i,elem) {
    if (printProblems)
    {
        console.log('Problem',i,$(this).text());
    }
    if (writeProblems)
    {
        fs.appendFile(outputFileProblems,$(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>')+'\n', (err)=> {
            if (err) throw err;
            
        });
    }
    ptProblems[i] = $(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>').replace(/'/g, '');

});
var uniqueProblems = [...new Set(ptProblems)]
uniqueProblems.forEach( (item)=>sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','Problems','${item}')`));

// SURGICAL HISTORY 
surgHx = [];
$('.surgicalhxitem','.surgicalhxlist').each(function (i,elem) {
    if (printSurgHx)
    {
        console.log($(this).text());
    }
    if (writeSurgHx)
    {
        fs.appendFile(outputFileSurgicalHx,$(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>').replace(/'/g, '')+'\n', (err)=> {
            if (err) throw err;
        });
    }
    surgHx[i] = $(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>').replace(/'/g, '');
    
});
var uniqueSurgHx = [...new Set(surgHx)];
uniqueSurgHx.forEach( (item)=>sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','SurgHx','${item}')`));

// MEDICATIONS
var medData = [];
$('.medicationtable').each(function (i,td) {
    var children =$(this).children();
    var contents =children.eq(i).text()+" ";
    if (contents.length>1){
        medData[i] = contents.replace('NameDateSource','').trim().split("\n");
    }
    
})
var uniqueRx = [...new Set(medData)];
uniqueRx.forEach( (item)=>sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','Medications','${item}')`));

// VACCINATIONS
var vaccines = [];
$('tr','.clinical_patient_vaccinelist_htmlsummary_sub').each(function (i,tr){
    var children = $(this).children();
    var vaccType = children.eq(0);
    var vaccDate = children.eq(1);
    var vaccAmt = children.eq(2);
    var vaccRoute = children.eq(3);
    var vaccSite = children.eq(4);
    var vaccLot = children.eq(5);
    var vaccMfr = children.eq(6);
    var vaccExp = children.eq(7);
    var vaccVISDate = children.eq(8);
    var vaccVISGiven = children.eq(9);
    var vaccinator = children.eq(10);
    var row= {
        "VaccineType": vaccType.text().replace(/\n/,'').trim()
         ,"Date": vaccDate.text().replace(/\n/,'').trim()
         ,"Amt.": vaccAmt.text().replace(/\n/,'').trim()
         ,"Route": vaccRoute.text().replace(/\n/,'').trim()
         ,"Site": vaccSite.text().replace(/\n/,'').trim()
         ,"Lot": vaccLot.text().replace(/\n/,'').trim()
         ,"Mfr.": vaccMfr.text().replace(/\n/,'').trim()
         ,"Exp.": vaccExp.text().replace(/\n/,'').trim()
         ,"Date on VIS": vaccVISDate.text().replace(/\n/,'').trim()
         ,"VIS Given": vaccVISGiven.text().replace(/\n/,'').trim()
         ,"Vaccinator": vaccinator.text().replace(/\n/,'').trim()
    }
    vaccines.push(row);
//    console.log(row);
});
var uniqueVaccines = [...new Set(vaccines)];
for (var i =0; i<uniqueVaccines.length; i++)
{
    if (uniqueVaccines[i].Date && uniqueVaccines[i].VaccineType != "Vaccine Type")
    {
        sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','Vaccinations','${uniqueVaccines[i]}')`)
        //console.log(i,uniqueVaccines[i]);
    }
}

// ALLERGIES
activeAllergies = [];
$('.activeallergy').each(function (i,elem) {
    activeAllergies[i] = $(this).text();
})
var uniqueAllergies = [...new Set(activeAllergies)];
uniqueAllergies.forEach( (item)=>sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','Vaccinations','${uniqueAllergies[i]}')`));

// PAST MEDICAL HISTORY
$('.pastmedicalhistoryquestion').each(function (i,elem) {
    var children = $(this).next();
    var answer = children.text().trim();
    var hx = $(this).text().trim()+': '+answer;
    //console.log(hx);
    sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','PastMedHx','${hx}')`)
})

// SOCIAL HISTORY -- no containing class

// FAMILY HISTORY
const famHx = [];
$('.familyhxtable','.clinicalsummarybox').each(function (i,elem) {
    famHx[i] = $(this).text().replace('\'', '\'\'').replace(/\n/,'').replace(/'/g, '');
})
for (var i=0; i<famHx.length;i++)
{
    sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','FamilyHx','${famHx[i]}')`);
    //console.log(famHx[i]);
}

// GYN HISTORY -- no containing class

// HISTORIC PREGNANCIES
cheerioTableParser($);
var data = $("#HISTORICPREGNANCIES").eq(0).parsetable(false,false,true);
var uniqueData = [...new Set(data)];
var numEntries = uniqueData[0][0].length-1;
//console.log(numEntries);
hxPregnancies = [];
for (var i=0; i<numEntries; i++)  //how many rows in table?
{
    var hxPregnancy = {};
    var elements = [];
    for (var j =0; j< uniqueData.length; j++)   //how many columns
    {
        elements.push(uniqueData[j][0]);
        for (var k=0; k<elements.length;k++)
        {
            hxPregnancy[elements[j]] = uniqueData[k][i+1];
        }
    }
    hxPregnancies.push(hxPregnancy);    
}
hxPregnancies.forEach( (item)=>sqlClinicalInserts.push(`insert into [nodeHTML].[clinical_extraction] (patientId, sectionName, sectionContent) values ('${patientID}','HxPregnancies','${item}')`));