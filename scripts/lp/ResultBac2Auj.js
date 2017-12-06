/* test.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io) ;
importPackage(Packages.java.net) ;
importPackage(Packages.java.util) ;
importPackage(Packages.java.lang) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.nu.xom) ;
importPackage(Packages.com.adlitteram.jspool) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

STAGING_DIR = "D:/LP/ArrExt/examen/ftp_tmp" ;
ERROR_DIR = "D:/LP/ArrExt/examen/err" ;
OUTPUT_DIR = ["D:/LP/ArrExt/examen/ftp_in", "D:/LP/ArrExt/examen/ftp_sav"] ;

var ZIP_DIR ;

// Unzip archive
function extractZip() {
    _print("Extracting Zip file");
    ZIP_DIR = new File(STAGING_DIR, _srcFile.getName() + "_dir") ;
    _print("ZIP_DIR: " + ZIP_DIR);
    //if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
    if ( !ZIP_DIR.exists() )
        ScriptUtils.unzipFileToDir(_srcFile.getFile(), ZIP_DIR) ;

    _print("Extracting Zip file done");
}

// Delete ZIP_DIR
function deleteZipDir() {
    _print("Purging " + ZIP_DIR);
    if ( ZIP_DIR.exists() ) FileUtils.forceDelete(ZIP_DIR) ;
}

// Process zip and set global variables
function processZip() {
    _print("Processing Zip File");

    var files = ZIP_DIR.listFiles() ;

    for (var i in files ) {
    		try {
	        var file = files[i] ;
	        var builder = new Builder();
	        var doc = builder.build(file);
	        var itemNode = doc.getRootElement() ;
	        var from = getValue(itemNode,"from");
	        var from2 = from.substr(from.lastIndexOf("@")+1);
	        var academie = (from2.substr(0, from2.lastIndexOf("."))).replace("ac-","");
	        academie = academie.replace("creteil","paris-creteil-versailles").replace("siec.education","paris-creteil-versailles");
	        academie = academie.replace("clermont", "clermont-ferrand");
	        _print("academie : " + academie);
			
		   var text = itemNode.query("texts/text").get(0).getValue() ;
	        var text2 = (text.substr(text.indexOf("href")+1)).replace("&gt", ">");
		   var link = text2.substr(5, text2.lastIndexOf(">https")-6).replace("&amp;", "&");
			 
		   // if sender contains hnmsg, we get the sender inside the body 
		   // we do the same thing just before in the sender
		   // we can refactor it !!!
		   if (academie.indexOf("hnmsg")!=-1) {
		   	  var text3 = text.substr(text.lastIndexOf("@")+1);
		   	  //_print("text3 : " + text3);
		   	  academie = (text3.substr(0, text3.lastIndexOf("."))).replace("ac-","");
		   	  academie = academie.replace("creteil","paris-creteil-versailles").replace("siec.education","paris-creteil-versailles");
	        	  academie = academie.replace("clermont", "clermont-ferrand");
	        	  _print("academie : " + academie);
		   }
		     
		   _print("URL : " + link);
		   if (link) {
				var url = new URL(link);
				// var proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress("10.196.20.193", 80));
				// var uc = url.openConnection(proxy);
				var uc = url.openConnection();
				uc.connect();
		
				var tmp = new StringBuffer();
				var reader = new BufferedReader(new InputStreamReader(uc.getInputStream()));
				var time = Calendar.getInstance().getTimeInMillis() ;
				for (var j in OUTPUT_DIR) {		
					var file = OUTPUT_DIR[j] + "/" + academie + "_" + time + ".txt" ;
					var writer = new BufferedWriter(new FileWriter(file)) ;
					while ((line = reader.readLine()) != null){
						//_print(line);
						tmp.append(line + "\n");	// $ed: pourquoi ne pas utiliser le writer directement ?
					}
					_print("writing " + file) ;
					writer.write(tmp);
					writer.close();
				}
				reader.close();
			} 
			else {
				_print("nothing to parse : URL not valid");
			}
    		}
    		catch (e) {
    			_print("processZip - " + e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]");
	          var dstFile = new File(ERROR_DIR, _srcFile.getName());
	          _print("processZip - copy " + _srcFile.getName() + " to " + dstFile.getPath());
	          FileUtils.copyFile(_srcFile.getFile(), dstFile);
	          return _OK;
    		}
     }
}

function nonNull(value) {
    return ( value == null ) ? "" : value ;
}

function capFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Trim string
function trim (str) {
    if ( str == null ) return null ;
    str += "" ;
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

function setNodeName(node, newName) {
    for(var i=node.getAttributeCount()-1; i>=0; i--) {
        var attr = node.getAttribute(i) ;
        //_print("node :" + node.getQualifiedName() + " attribut: " + attr) ;
        node.removeAttribute(attr) ;
    }
    node.setLocalName(newName) ;
}

function insertNode(node, newTag, newName) {
    var newNode = new Element(newTag) ;
    node.getParent().replaceChild(node, newNode) ;
    newNode.appendChild(node) ;
    node.setLocalName(newName) ;
}

// Get the value depending on the xpath
function getValue(node, xpath) {
    var nodes = node.query(xpath) ;
    if ( nodes == null || nodes.size() == 0 ) return "" ;
    if ( nodes.size() > 1 ) _print("xpath: " + xpath + " - multiple values: " + nodes.get(0).getValue())
    return nodes.get(0).getValue() ;
}

// Create <tag> value </tag>
function createElement(tag, value) {
    var element = new Element(tag) ;
    element.appendChild(value);
    return element ;
}

// Main
function main() {
    _print("Starting Process");

    extractZip() ;
    processZip() ;
    deleteZipDir() ;

    _print("Process Done");

    return _OK ;
    //return _KEEP ;
}

// start & exit
try {
    _exit = main() ;
}
catch (e) {
    _print(e.name + ": " + e.message + " - " + e.fileName + " [" + e.lineNumber + "]") ;
    _exit = _FAIL;
}