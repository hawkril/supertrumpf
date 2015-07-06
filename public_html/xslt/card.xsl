<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : card.xsl
    Created on : 24. Juni 2015, 01:41
    Author     : user
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html"/>
    
    <xsl:template match="//card">
        <div class="card">
            <div class="cardtitle">
                <h1>
                    <xsl:value-of select="/title" />
                </h1>
            </div>
            <div class="cardimage">
                <img src="" />
            </div>
            <div class="cardproperties">
                <xsl:apply-templates />
            </div>
        </div>
    </xsl:template>


    <xsl:template match="value">
        <xsl:variable name="propertyid" select="position()" />
        <div id="property-{$propertyid}" class="property">
            <xsl:value-of select="." />
        </div>
    </xsl:template>
    
    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>
    
</xsl:stylesheet>
