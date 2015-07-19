$.fn.toXml = function() {
    var xmlString;
    //IE
    if (window.ActiveXObject){
        xmlString = this.xml;
    }
    // code for Mozilla, Firefox, Opera, etc.
    else{
        xmlString = (new XMLSerializer()).serializeToString(this[0]);
    }
    return xmlString;
};