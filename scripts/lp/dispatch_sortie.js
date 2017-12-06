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
importPackage(Packages.org.apache.commons.io) ;

// Debug
//_print("srcDir : " + _srcDir);
//_print("srcFile : " + _srcFile.getPath());

//////////////////////////////////////////////////////////////////////////////////////
// Paramètres
//////////////////////////////////////////////////////////////////////////////////////

var ALL_PDF    = [ "D:/LP/ArrMethode/pages/milibris/milibris_in", "D:/LP/ArrMethode/pages/sdv/sdv_in", "D:/LP/ArrMethode/pages/twipe/twipe_in", "D:/LP/ArrMethode/pages/legal/legal_in", "D:/LP/ArrMethode/pages/manchette/manchette_in", "D:/LP/ArrMethode/pages/suivi", "D:/LP/ArrMethode/pages/qwam_in", "D:/LP/ArrMethode/pages/edd/edd_parisien_in" ] ;

var ALL_JPG    = [ "D:/LP/ArrMethode/pages/legal/legal_ftp" ] ;

// Aujourd'hui en France
var AUJ_PDF     = [ "D:/LP/ArrMethode/pages/rotocean/rotocean_in", "D:/LP/ArrMethode/pages/npdirect/npdirectauj_in", "D:/LP/ArrMethode/pages/propress/propress_auj_in", "D:/LP/ArrMethode/pages/immanens/immanens_auj_in", "D:/LP/ArrMethode/pages/lefigaro_in", "D:/LP/ArrMethode/pages/edd/edd_auj_in" ] ;
var AUJ_JPG     = [ ] ;

// Aujourd'hui en France national
var AUJ_NAT_PDF    = [ "D:/LP/ArrMethode/pages/equidia/equidia_in" ] ;
var AUJ_NAT_JPG    = [ ] ;

// Aujourd'hui en France - Une Nationale
var AUJ_NAT_UNE_PDF = [ "D:/LP/ArrMethode/pages/lequipe/lequipe_in", "D:/LP/ArrMethode/pages/ventes/ventes_in", "D:/LP/ArrMethode/pages/sdvp/sdvp_in" ] ;
var AUJ_NAT_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes/ventes_ftp", "D:/LP/ArrMethode/pages/sdvp/sdvp_ftp", "D:/LP/ArrMethode/pages/unes", "D:/LP/ArrMethode/pages/opentlv/opentlv_auj_ftp", "D:/LP/ArrMethode/pages/revuepresse" , "D:/LP/ArrMethode/pages/laposte_in", "D:/LP/ArrMethode/pages/relay/relay_auj_mail" , "D:/LP/ArrMethode/pages/spqn/spqn_in"] ;

// Le Parisien complet (TRC + CAHIERS + SUPPLEMENTS)
var PAR_PDF     = [ "D:/LP/ArrMethode/pages/npdirect/npdirectlp_in" ] ;
var PAR_JPG     = [ ] ;

// Le Parisien edition 75 complete (TRC + CAHIERS + SUPPLEMENTS)
var PAR_75_PDF  = [ "D:/LP/ArrMethode/pages/afp/afp_in", "D:/LP/ArrMethode/pages/propress/propress_lp_in", "D:/LP/ArrMethode/pages/immanens/immanens_lp_in", "D:/LP/ArrMethode/pages/lequipe/lequipe21_in" , "D:/LP/ArrMethode/pages/airfrance/airfrance_in", "D:/LP/ArrMethode/pages/lefigaro_in" ] ;
var PAR_75_JPG  = [ ] ;

// Le Parisien edition 75 (TRC)
var PAR_75_NAT_PDF  = [ ] ;
var PAR_75_NAT_JPG  = [ "D:/LP/ArrMethode/pages/viadirect" ] ;

// Le Parisien cahiers nationaux
var PAR_NAT_PDF = [  ] ;
var PAR_NAT_JPG = [  ] ;

// Le Parisien Unes des cahiers nationaux
var PAR_NAT_UNE_PDF = [ "D:/LP/ArrMethode/pages/lequipe/lequipe_in", "D:/LP/ArrMethode/pages/spqr/spqr_in", "D:/LP/ArrMethode/pages/sdvp/sdvp_in" ] ;
var PAR_NAT_UNE_JPG = [ "D:/LP/ArrMethode/pages/sdvp/sdvp_ftp" ] ;

// Le Parisien Une du cahier national 75
var PAR_75_UNE_PDF = [ "D:/LP/ArrMethode/pages/ventes/ventes_in" , "D:/LP/ArrMethode/pages/spqr/unes/pdf" ] ;
var PAR_75_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes/ventes_ftp", "D:/LP/ArrMethode/pages/opentlv/opentlv_lp_ftp", "D:/LP/ArrMethode/pages/unes", "D:/LP/ArrMethode/pages/relay/relay_lp_mail" , "D:/LP/ArrMethode/pages/spqr/unes/jpg" ]  ;

// Le Parisien Une du cahier national 7S
var PAR_7S_UNE_PDF = [ ] ;
var PAR_7S_UNE_JPG = [ ] ;

// Le Parisien Une du cahier national 7N
var PAR_7N_UNE_PDF = [ ] ;
var PAR_7N_UNE_JPG = [ ] ;

// Le Parisien Unes des cahiers départementaux
var PAR_DPT_UNE_PDF = [ "D:/LP/ArrMethode/pages/ventes/ventes_in" ] ;
var PAR_DPT_UNE_JPG = [ "D:/LP/ArrMethode/pages/ventes/ventes_ftp" ] ;

// Définitions de expression régulières PDF
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

// Définitions de expression régulières JPEG
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

// Copie les fichier vers les répertoires
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
