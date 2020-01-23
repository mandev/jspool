/* 
 * Emmanuel Deviller
* 
 * _srcDir : the spooled directory (String)
* _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
* Attention aux mots réservés : ex.  file.delete => file["delete"] )
*/

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util)  ;
importPackage(Packages.java.lang)  ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.com.adlitteram.jspool) ;
importPackage(Packages.nu.xom) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());
OUTPUT_DIRS = [ "C:/dsiprod/production" ] ;
var toReplaceString =  ["_I_","_II_","_III_","_IV_","_V_","_VI_","_VII_","_VIII_","_IX_","_X_","_XI_","_XII_","_XIII_","_XIV_","_XV_","_XVI_","_XVII_","_XVIII_","_XIX_","_XX_","_XXI_","_XXII_","_XXIII_","_XXIV_"];
var toReplaceString2 =  ["_A_","_B_","_C_","_D_","_E_","_F_","_G_","_H_","_I_","_J_","_K_","_L_","_M_","_N_","_O_","_P_","_Q_","_R_","_S_","_T_","_U_","_V_","_W_","_X_"];
var replacingString =  ["_1_","_2_","_3_","_4_","_5_","_6_","_7_","_8_","_9_","_10_","_11_","_12_","_13_","_14_","_15_","_16_","_17_","_18_","_19_","_20_","_21_","_22_","_23_","_24_"];


// 29/08/2012 17:31:19 
function getTime() {
    var d = new Date() ;
    return  pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) ;
}

function formatTime(date) {
    return  date.substr(0,2) + date.substr(3,2) + date.substr(8,2) ;
}

function pad(num) {
    return ( num < 10 ) ? "0" + num : "" + num  ;
}

// Not used but left in case of 
function normalizeName(input, style) {
   if (style == 1) {
      for (var i = 0; i<toReplaceString.length; i++) {
          input = input.replace(toReplaceString[i], replacingString[i]);
      }
   } else if (style == 2) {
      for (var i = 0; i<toReplaceString.length; i++) {
          input = input.replace(toReplaceString2[i], replacingString[i]);
      }
   } 
   return input;
}

function createPageArray(pageNodes) {
    var pageArray = new Array() ;
    for (var k = 0; k < pageNodes.size(); k++) {
        var pageNode = pageNodes.get(k);
        pageArray.push(pageNode) ;
        var pagePn = pageNode.getAttributeValue("pn") ;
        if ( pagePn.contains(",") ) pageArray.push(pageNode) ;
    }
    return pageArray ;
}

function processFile(file) {
    _print("processFile: " + file);

    var XOM = ScriptUtils.createXomBuilder(false, false) ;
    var doc = XOM.build(file);
    var productNode = doc.getRootElement();
    var issueDate = productNode.getAttributeValue("issueDate") + ""  ;
    var buffer = new StringBuffer();
            
    var editionNodes = productNode.getChildElements()  ;
    for (var i = 0; i < editionNodes.size(); i++) {
        var editionNode = editionNodes.get(i);
        var editionName = editionNode.getAttributeValue("name") + "" ;
	   
        var bookNodes = editionNode.getChildElements() ;
        for (var j = 0; j < bookNodes.size(); j++) {
            var bookNode = bookNodes.get(j) ;
            var bookName = bookNode.getAttributeValue("methodeName") + "";

	       var pageNodes = bookNode.getChildElements() ;
            var pageArray = createPageArray(pageNodes) ;
            
            // verify if page number style is roman = 1, arabic = 2, letter = 0
            // we give it to normalize function
            var pageNumberStyle = 0;
            var pageNode1 = pageArray[0];
            if (pageNode1.getAttributeValue("pn") == "I") {
            	pageNumberStyle = 1;
            } else if (pageNode1.getAttributeValue("pn") == "A") {
            	pageNumberStyle = 2;
            }
            for (var k = 0; k < pageArray.length; k++) {
            	 var pageNode = pageArray[k];
            
                var masterEdition = pageNode.getAttributeValue("masterEdition");
                var bookPageNumber = pageNode.getAttributeValue("pn") + "";
                var masterPnEditionNumber = pageNode.getAttributeValue("masterPnEditionNumber");
                if (masterEdition!=editionName) {
                	var masterBookNodes = productNode.query("//product/edition[@name='"+ masterEdition + "']/book");
                	var newBookName = "";
                	var newBookPageNumber = "";
                	for (var l = 0; l < masterBookNodes.size(); l++) {
                		var masterBookNode = masterBookNodes.get(l);
                		var masterPageNodes = masterBookNode.getChildElements() ;
                		for (var m = 0; m < masterPageNodes.size(); m++) {
                			if (masterPageNodes.get(m).getAttributeValue("pnEditionNumber") == masterPnEditionNumber) {
							newBookName = masterBookNode.getAttributeValue("methodeName") + "";
							newBookPageNumber = masterPageNodes.get(m).getAttributeValue("pn") + "";
                			}
                		}
                		if (newBookName) break;
                	}
                	if (newBookName) {
                		if (bookPageNumber.indexOf(",", 0)>0) {
                			var pageNumbers=bookPageNumber.split(",");
                			firstBookPageNumber = pageNumbers[0];
                			secondBookPageNumber = pageNumbers[1];
                			var newPageNumbers=newBookPageNumber.split(",");
                			firstNewBookPageNumber = pageNumbers[0];
                			secondNewBookPageNumber = pageNumbers[1];
 		                	var oldName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + bookName + "_" + firstBookPageNumber + "_"; 
		                	var newName = "PAGE_" + formatTime(issueDate) + "_PAR_" + masterEdition + "_" + newBookName + "_" + firstNewBookPageNumber + "_";
		                	buffer.append(oldName + ";" + newName + "\r\n");
		                	_print("processFile: " + oldName + ";" + newName);
		                	oldName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + bookName + "_" + secondBookPageNumber + "_"; 
		                	newName = "PAGE_" + formatTime(issueDate) + "_PAR_" + masterEdition + "_" + newBookName + "_" + secondNewBookPageNumber + "_";
		                	buffer.append(oldName + ";" + newName + "\r\n");
		                	_print("processFile: " + oldName + ";" + newName);
               		}
                		else {
		                	var oldName = "PAGE_" + formatTime(issueDate) + "_PAR_" + editionName + "_" + bookName + "_" + bookPageNumber + "_"; 
		                	var newName = "PAGE_" + formatTime(issueDate) + "_PAR_" + masterEdition + "_" + newBookName + "_" + newBookPageNumber + "_";
		                	buffer.append(oldName + ";" + newName + "\r\n");
		                	_print("processFile: " + oldName + ";" + newName);
	                	}
                	}
                }
            }
        }
    }
    
    // LeParisien_2012-08-30.xml.ctde
    // var filename = "LeParisien_" +  issueDate.substr(6,4) + "-" + issueDate.substr(3,2) + "-" + issueDate.substr(0,2) + ".xml.map" ;
    var filename = issueDate.substr(0,2) + issueDate.substr(3,2) + issueDate.substr(8,2) + "_pagin_inheritance.txt" ;

    for (i in OUTPUT_DIRS) {
        var dstFile = new File(OUTPUT_DIRS[i] + "/" + formatTime(issueDate), filename) ;
        _print("write to file: " + OUTPUT_DIRS[i] + "/" + formatTime(issueDate) + "/" + filename);
        var bw = new BufferedWriter(new FileWriter(dstFile));
    	   bw.write(buffer.toString());
    	   bw.close() ;
    }		        
			  
}

function main() {
    processFile(_srcFile.getFile()) ;
    return _OK ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}

