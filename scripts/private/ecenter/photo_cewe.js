/* pdf_dcopy.js
 * Emmanuel Deviller
 *
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile)
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP)
 *
 * Attention aux mots réservés : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.java.util) ;
importPackage(Packages.org.apache.commons.io) ;
importPackage(Packages.org.apache.commons.lang) ;
importPackage(Packages.nu.xom) ;

// CEWE Customer Data
KEYACCOUNTID = "19229" ;
CUSTOMERID = "PM219949" ;

// A vérifier: 71=11x15, 66=13x17, 67=13x19 , 68=20x27, 63=10x13
PICS_CODES = [ "62"  , "70"   , "71"   , "67"   , "-----", "69"   , "-----", "-----", "-----", "-----"] ;
CEWE_CODES = [ "9x13", "10x15", "11x17", "13x18", "15x20", "20x30", "25x75", "30x45", "40x60", "50x75"] ;

// Country Codes
ISO_CODES = [ "DE", "NL", "DK", "NO", "SE", "BE", "FR", "PL", "CZ", "SK", "AT", "CH", "ES", "GB"] ;
CTR_CODES = [ "Germany", "Netherlands", "Denmark", "Norway", "Sweden", "Belgium", "France", "Poland", "Czech Republic", "Slovakia", "Austria", "Switzerland", "Spain", "Great Britain"] ;

// Variables
fileCount = 1 ;
fileArray = [] ;
nameArray = [] ;

function getIsoCode(country) {
    var c = country.toLowerCase() ;
    for(var i in CTR_CODES) {
        if ( c == CTR_CODES[i].toLowerCase() ) return ISO_CODES[i] ;
    }
    return "" ;
}

// yyyymmddhhmmss
function getDateTime() {
    var dd = new Date();
    var year = dd.getFullYear();
    var month = dd.getMonth();
    var day = dd.getDate();
    var hours = dd.getHours();
    var minutes = dd.getMinutes();
    var seconds = dd.getSeconds();

    if (month < 10) month = "0" + month ;
    if (day < 10) day = "0" + day ;
    if (hours < 10) hours = "0" + hours ;
    if (minutes < 10) minutes = "0" + minutes ;
    if (seconds < 10) seconds = "0" + seconds ;

    return year + "" + month + "" + day + "" + hours + "" + minutes + "" + seconds ;
}

function trim(str){
    return str.replace(/^\s+/g,'').replace(/\s+$/g,'')
}

function buildXmlDocument(file) {
    _print("BuildXmlDocument: " + file.getName());
    var builder = new Builder();
    var doc = builder.build(file);

    orderId = doc.query("/order/customer/entry [@key='PurchaseId']").get(0).getValue() ;
    outputDir = "C:/tmp/ed1/"+ CUSTOMERID + "_" + orderId ;
    errorDir = "C:/tmp/error/" ;

    return doc ;
}

function writeMain(writer, doc) {
    _print("writeMain()");
    writer.write("CUSTOMERID=" + CUSTOMERID + "\n") ;
    writer.write("KEYACCOUNTID=" + KEYACCOUNTID + "\n") ;
    writer.write("SOFTWAREID=20.00.00.00\n") ;
    writer.write("CHARACTERSET=2\n") ;
    writer.write("LANGUAGE=fr\n") ;
    writer.write("CURRENCY=EUR\n") ;
    writer.write("ORDERID=" + StringUtils.leftPad(orderId, 6, '0') + "\n") ;     // 6 caractères max
    writer.write("DATETIME=" + getDateTime() + "\n") ;
}

function writePayment(writer, doc) {
    _print("writePayment()");
    writer.write("METHOD=4\n") ;
    writer.write("STATUS=00\n") ;
}

function writeCustship(writer, doc) {
    _print("writeCustship()");
    writer.write("METHOD=0\n") ;
    writer.write("TRANSFERDESCRIPTION=Livraison\n") ;
}

function writeCustomer(writer, doc) {
    _print("writeCustomer()");
    writer.write("(CUSTOMERA)\n") ;
    writer.write("DELIVERY=00\n") ;
    writer.write("NAME=" + doc.query("/order/customer/entry [@key='LastName']").get(0).getValue() + "\n") ;
    writer.write("FIRSTNAME=" + doc.query("/order/customer/entry [@key='FirstName']").get(0).getValue() + "\n") ;

    var address = doc.query("/order/customer/entry [@key='Address']").get(0).getValue() + "";
    var street = WordUtils.abbreviate(address, 30, 38, "") + "" ;
    writer.write("STREET=" + street + "\n") ;
    if ( street.length < address.length ) writer.write("CITYPART=" + trim(address.substr(street.length)) + "\n") ;

    writer.write("ZIP=" + doc.query("/order/customer/entry [@key='ZipCode']").get(0).getValue() + "\n") ;
    writer.write("CITY=" + doc.query("/order/customer/entry [@key='City']").get(0).getValue() + "\n") ;

    var country = doc.query("/order/customer/entry [@key='Country']").get(0).getValue() ;
    writer.write("COUNTRY=" + country + "\n") ;
    writer.write("ISOCOUNTRY=" + getIsoCode(country) + "\n") ;
}

function writeProducts(writer, doc) {
    _print("writeProducts()");

    for(var i in PICS_CODES ) {
        var picsCode = PICS_CODES[i] ;
        if ( picsCode == "-----" ) continue ;
        var ceweCode = CEWE_CODES[i] ;
        //_print("writeProducts(): ceweCode=" + ceweCode + " - picsCode: " + picsCode) ;

        var itemNodes = doc.query("/order/items/item [@code='" + picsCode +"']") ;
        if ( itemNodes.size() > 0 ) {
            writer.write("\n[" + ceweCode + "]\n") ;
            for (var i=0; i<itemNodes.size(); i++) {
                var itemNode = itemNodes.get(i) ;

                var path = itemNode.getAttribute("filename").getValue() ;
                var file = new File(path) ;
                
                if ( file.exists() && file.canRead() && !file.isDirectory() ) {
                    writer.write("QTY=" + itemNode.getAttribute("quantity").getValue() + "\n") ;
                    writer.write("OPTIMIZE=1\n") ;
                    writer.write("SALESLINE=4\n") ;
                    var name = (fileCount++) + ".jpg" ;
                    writer.write("FILE=" +  name + "\n") ;

                    fileArray.push(file) ;
                    nameArray.push(name) ;
                }
                else {
                    throw ("Le fichier " + path + " n'existe pas. Commande annulée");
                }
            }
        }
        else {
            _print("code " + picsCode + " non présent");
        }
    }
}

// Write the XML for the page turner component
function writeOrder(writer, doc) {
    _print("writeOrder()");

    writer.write("[MAIN]\n") ;
    writeMain(writer, doc) ;

    writer.write("\n[CUSTOMER]\n") ;
    writeCustomer(writer, doc) ;

    writer.write("\n[PAYMENT]\n") ;
    writePayment(writer, doc) ;

    writer.write("\n[PRODUCT]\n") ;
    writer.write("\n[CUSTSHIP]\n") ;
    writeCustship(writer, doc) ;
    writeProducts(writer, doc) ;
}

function copyFiles() {
    _print("CopyFiles()");
    for(var i in fileArray) {
        FileUtils.copyFile(fileArray[i], new File(outputDir, nameArray[i])) ;
    }
}

function error(writer, message) {
    _print("ERROR: " + message);

    writer.write("\n*******************************************************\n");
    writer.write("*******************************************************\n\n");
    writer.write("ERROR : " + message + "\n" ) ;
    writer.write("\n*******************************************************\n");
    writer.write("*******************************************************\n");
}

// Main
function main() {

    var doc = buildXmlDocument(_srcFile.getFile()) ;

    var dir = new File(outputDir) ;
    if ( ! dir.exists() ) dir.mkdirs() ;

    var tmpFile = new File(outputDir, "order_" + orderId + ".tmp") ;
    var writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(tmpFile), "UTF-8"));

    try {
        writeOrder(writer, doc) ;
        copyFiles() ;
    }
    catch (errorMessage) {
        error(writer, errorMessage) ;
        IOUtils.closeQuietly(writer) ;
        var dstFile = new File(errorDir, "order_" + orderId + ".txt") ;
        FileUtils.deleteQuietly(dstFile) ;
        FileUtils.copyFile(tmpFile, dstFile) ;
        return _OK ;
    }

    IOUtils.closeQuietly(writer) ;
    FileUtils.moveFile(tmpFile, new File(outputDir, "order.txt")) ;
    return _OK ;
}

// start & exit
_exit = main() ;
