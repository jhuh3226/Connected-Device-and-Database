const csvtojsonV2=require("csvtojson");
const csvtojsonV2=require("csvtojson/v2");
 
/** csv file
a,b,c
1,2,3
4,5,6
*/
const csvFilePath='<data/01-01-2021.csv>'
const csv=require('csvtojson')
csv()
.fromFile(csvFilePath)
.then((jsonObj)=>{
    console.log(jsonObj);
    /**
     * [
     * 	{a:"1", b:"2", c:"3"},
     * 	{a:"4", b:"5". c:"6"}
     * ]
     */ 
})
 
// Async / await usage
const jsonArray=await csv().fromFile(csvFilePath);