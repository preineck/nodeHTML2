// some vaccine crap
// $('.reskindatatable','.clinical_patient_vaccinelist_htmlsummary_sub').each(function (i,elem){
//     if (printVaccine)
//     {
//         console.log(i,$(this).text());
//     }
//     if (writeVaccine)
//     {
//         fs.appendFile(outputFileVaccine,$(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>').replace(/'/g, '')+'\n', (err)=> {
//             if (err) throw err;
//         });      
//     }
//     vaccines[i] = $(this).text().replace(/[\n\r]/g,'<br>').trim().replace(/\n/,'<br>').replace(/'/g, '');
// });
// vaccines.forEach( (item)=>console.log(item));
    


// HISTORIC PREGNANCIES
cheerioTableParser($);
var data = $("#HISTORICPREGNANCIES").parsetable(false,false,true);
for (var i =0; i<data.length; i++)
{
    fs.appendFile(outputFilehxPregnancies,data[i], (err)=> {
        if(err) throw err;
 
    })
}