/* 
 * Emmanuel Deviller
 * 
 * _srcDir : the spooled directory (String)
 * _srcFile : the file found (SourceFile) 
 * _exit : exit value (_OK,_FAIL,_NOP,_KEEP) 
 *
 * Attention aux mots r�serv�s : ex.  file.delete => file["delete"] )
 */

importPackage(Packages.java.io)  ;
importPackage(Packages.org.apache.commons.io) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

//////////////////////////////////////////////////////////////////////////////////////
// Param�tres
//////////////////////////////////////////////////////////////////////////////////////

var ALL_PDF    = [ "D:/LP/ArrMethode/pages/milibris_before_rename", "D:/LP/ArrMethode/pages/sdv", "D:/LP/ArrMethode/pages/legal", "D:/LP/ArrMethode/pages/manchette", "D:/LP/ArrMethode/pages/suivi", "D:/LP/ArrMethode/pages/portail" ] ;

var ALL_JPG    = [ "D:/LP/ArrMethode/pages/legal", "D:/LP/ArrMethode/pages/suivi" ] ;

// Aujourd'hui en France
var AUJ_PDF     = [ "D:/LP/ArrMethode/pages/rotocean", "D:/LP/ArrMethode/pages/propress" ] ;
var AUJ_JPG     = [ ] ;

// Aujourd'hui en France national
var AUJ_NAT_PDF    = [ "D:/LP/ArrMethode/pages/npdirect", "D:/LP/ArrMethode/pages/equidia" ] ;
var AUJ_NAT_JPG    = [ ] ;

// Aujourd'hui en France - Une Nationale
var AUJ_NAT_UNE_PDF = [ "D:/LP/ArrMethode/pages/lequipe", "D:/LP/ArrMethode/pages/ventes", "D:/LP/ArrMethode/pages/sdvp" ] ;
var AUJ_NAT_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes", "D:/LP/ArrMethode/pages/sdvp", "D:/LP/ArrMethode/pages/unes", "D:/LP/ArrMethode/pages/opentlvauj", "D:/LP/ArrMethode/pages/revuepresse"  ] ;

// Le Parisien complet (TRC + CAHIERS + SUPPLEMENTS)
var PAR_PDF     = [ ] ;
var PAR_JPG     = [ ] ;

// Le Parisien edition 75 complete (TRC + CAHIERS + SUPPLEMENTS)
var PAR_75_PDF  = [ "D:/LP/ArrMethode/pages/afppar75", "D:/LP/ArrMethode/pages/propresslp" ] ;
var PAR_75_JPG  = [ ] ;

// Le Parisien edition 75 (TRC)
var PAR_75_NAT_PDF  = [ ] ;
var PAR_75_NAT_JPG  = [ "D:/LP/ArrMethode/pages/viadirect" ] ;

// Le Parisien cahiers nationaux
var PAR_NAT_PDF = [ "D:/LP/ArrMethode/pages/npdirectlp" ] ;
var PAR_NAT_JPG = [  ] ;

// Le Parisien Unes des cahiers nationaux
var PAR_NAT_UNE_PDF = [ "D:/LP/ArrMethode/pages/lequipe", "D:/LP/ArrMethode/pages/spqr", "D:/LP/ArrMethode/pages/sdvp" ] ;
var PAR_NAT_UNE_JPG = [ "D:/LP/ArrMethode/pages/sdvp" ] ;

// Le Parisien Une du cahier national 75
var PAR_75_UNE_PDF = [ "D:/LP/ArrMethode/pages/ventes"] ;
var PAR_75_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes", "D:/LP/ArrMethode/pages/opentlv", "D:/LP/ArrMethode/pages/unes" ] ;

// Le Parisien Une du cahier national 7S
var PAR_7S_UNE_PDF = [ ] ;
var PAR_7S_UNE_JPG = [ ] ;

// Le Parisien Une du cahier national 7N
var PAR_7N_UNE_PDF = [ ] ;
var PAR_7N_UNE_JPG = [ ] ;

// Le Parisien Unes des cahiers d�partementaux
var PAR_DPT_UNE_PDF = [ "D:/LP/ArrMethode/pages/ventes" ] ;
var PAR_DPT_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes" ] ;

// D�finitions de expression r�guli�res PDF
var re_pdf             = new RegExp("^PAGE_\\d+_PAR_.+_.+_\\d+_\\d+\\.pdf", "i") ;
var re_auj_pdf         = new RegExp("^PAGE_\\d+_PAR_AUJ_.+_\\d+_\\d+\\.pdf", "i") ;
var re_auj_nat_pdf     = new RegExp("^PAGE_\\d+_PAR_AUJ_CNAT_\\d+_\\d+\\.pdf", "i") ;
var re_auj_nat_une_pdf = new RegExp("^PAGE_\\d+_PAR_AUJ_CNAT_1_\\d+\\.pdf", "i") ;
//
var re_par_pdf         = new RegExp("^PAGE_\\d+_PAR_PAR\\d._.+_\\d+_\\d+\\.pdf", "i") ;
var re_par_75_pdf      = new RegExp("^PAGE_\\d+_PAR_PAR75_.+_\\d+_\\d+\\.pdf", "i") ;
var re_par_75_nat_pdf      = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_\\d+_\\d+\\.pdf", "i") ;

var re_par_75_une_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_1_\\d+\\.pdf", "i") ;
var re_par_7S_une_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR7S_T7S_1_\\d+\\.pdf", "i") ;
var re_par_7N_une_pdf  = new RegExp("^PAGE_\\d+_PAR_PAR7N_T7N_1_\\d+\\.pdf", "i") ;

var re_par_nat_pdf = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(T60|T75|T7N|T7S|T78|T91|T92|T93|T94|T95)_\\d+\\_\\d+\\.pdf", "i") ;

var re_par_nat_une_pdf = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(T60|T75|T7N|T7S|T78|T91|T92|T93|T94|T95)_1_\\d+\\.pdf", "i") ;
var re_par_dpt_une_pdf = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(E60|E75|E7N|E7S|E78|E91|E92|E93|E94|E95)_1_\\d+\\.pdf", "i") ;

// D�finitions de expression r�guli�res JPEG
var re_jpg             = new RegExp("^PAGE_\\d+_PAR_.+_.+_\\d+_\\d+\\.jpg", "i") ;
var re_auj_jpg         = new RegExp("^PAGE_\\d+_PAR_AUJ_.+_\\d+_\\d+\\.jpg", "i") ;
var re_auj_nat_jpg     = new RegExp("^PAGE_\\d+_PAR_AUJ_CNAT_\\d+_\\d+\\.jpg", "i") ;
var re_auj_nat_une_jpg = new RegExp("^PAGE_\\d+_PAR_AUJ_CNAT_1_\\d+\\.jpg", "i") ;
//
var re_par_jpg         = new RegExp("^PAGE_\\d+_PAR_PAR\\d._.+_\\d+_\\d+\\.jpg", "i") ;
var re_par_75_jpg      = new RegExp("^PAGE_\\d+_PAR_PAR75_.+_\\d+_\\d+\\.jpg", "i") ;
var re_par_75_nat_jpg      = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_\\d+_\\d+\\.jpg", "i") ;

var re_par_75_une_jpg  = new RegExp("^PAGE_\\d+_PAR_PAR75_T75_1_\\d+\\.jpg", "i") ;
var re_par_7S_une_jpg  = new RegExp("^PAGE_\\d+_PAR_PAR7S_T7S_1_\\d+\\.jpg", "i") ;
var re_par_7N_une_jpg  = new RegExp("^PAGE_\\d+_PAR_PAR7N_T7N_1_\\d+\\.jpg", "i") ;

var re_par_nat_jpg = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(T60|T75|T7N|T7S|T78|T91|T92|T93|T94|T95)_\\d+\\_\\d+\\.jpg", "i") ;

var re_par_nat_une_jpg = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(T60|T75|T7N|T7S|T78|T91|T92|T93|T94|T95)_1_\\d+\\.jpg", "i") ;
var re_par_dpt_une_jpg = new RegExp("^PAGE_\\d+_PAR_PAR\\d._(E60|E75|E7N|E7S|E78|E91|E92|E93|E94|E95)_1_\\d+\\.jpg", "i") ;

// Copie les fichier vers les r�pertoires
function copyFileTo(dirs) {
    for (i in dirs) {
        var destFile = new File(dirs[i], _srcFile.getName()) ;
        _print("copie : " + _srcFile.getName() + " vers " + destFile.getPath()) ;
        FileUtils.copyFile(_srcFile.getFile(), destFile) ;
    }
}

// Main
function main() {

    var name = _srcFile.getName() ;

    if ( name.match(re_jpg) ) copyFileTo(ALL_JPG) ;
    if ( name.match(re_auj_jpg) ) copyFileTo(AUJ_JPG) ;
    if ( name.match(re_auj_nat_jpg) ) copyFileTo(AUJ_NAT_JPG) ;
    if ( name.match(re_auj_nat_une_jpg) ) copyFileTo(AUJ_NAT_UNE_JPG) ;
    if ( name.match(re_par_jpg) ) copyFileTo(PAR_JPG) ;
    if ( name.match(re_par_75_jpg) ) copyFileTo(PAR_75_JPG) ;
    if ( name.match(re_par_75_nat_jpg) ) copyFileTo(PAR_75_NAT_JPG) ;
    if ( name.match(re_par_75_une_jpg) ) copyFileTo(PAR_75_UNE_JPG) ;
    if ( name.match(re_par_7S_une_jpg) ) copyFileTo(PAR_7S_UNE_JPG) ;
    if ( name.match(re_par_7N_une_jpg) ) copyFileTo(PAR_7N_UNE_JPG) ;
    if ( name.match(re_par_nat_jpg) ) copyFileTo(PAR_NAT_JPG) ;
    if ( name.match(re_par_nat_une_jpg) ) copyFileTo(PAR_NAT_UNE_JPG) ;
    if ( name.match(re_par_dpt_une_jpg) ) copyFileTo(PAR_DPT_UNE_JPG) ;

    if ( name.match(re_pdf) ) copyFileTo(ALL_PDF) ;
    if ( name.match(re_auj_pdf) ) copyFileTo(AUJ_PDF) ;
    if ( name.match(re_auj_nat_pdf) ) copyFileTo(AUJ_NAT_PDF) ;
    if ( name.match(re_auj_nat_une_pdf) ) copyFileTo(AUJ_NAT_UNE_PDF) ;
    if ( name.match(re_par_pdf) ) copyFileTo(PAR_PDF) ;
    if ( name.match(re_par_75_pdf) ) copyFileTo(PAR_75_PDF) ;
    if ( name.match(re_par_75_nat_pdf) ) copyFileTo(PAR_75_NAT_PDF) ;
    if ( name.match(re_par_75_une_pdf) ) copyFileTo(PAR_75_UNE_PDF) ;
    if ( name.match(re_par_7S_une_pdf) ) copyFileTo(PAR_7S_UNE_PDF) ;
    if ( name.match(re_par_7N_une_pdf) ) copyFileTo(PAR_7N_UNE_PDF) ;
    if ( name.match(re_par_nat_pdf) ) copyFileTo(PAR_NAT_PDF) ;
    if ( name.match(re_par_nat_une_pdf) ) copyFileTo(PAR_NAT_UNE_PDF) ;
    if ( name.match(re_par_dpt_une_pdf) ) copyFileTo(PAR_DPT_UNE_PDF) ;

    return _OK ;
}

// start & exit
_exit = main() ;