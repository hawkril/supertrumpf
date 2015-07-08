<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : card.xsl
    Created on : 24. Juni 2015, 01:41
    Author     : user
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:param name="active" />
    
    <xsl:template match="//card">
        <div class="mainbox {$active} cardpage">
            <xsl:variable name="path" select="card_pic" />
            <div class="card">
                <xsl:if test="$active = 'active'">
                    <div>Du bist dran...</div>
                </xsl:if>
                <xsl:if test="$active != 'active'">
                    <div>Ein anderer Spieler ist am Zug. Warte bitte...</div>
                </xsl:if>
                <div class="cardtitle">
                    <h1>
                        <xsl:value-of select="titel" />
                    </h1>
                </div>
                <div class="cardimage">
                    <img src="{$path}" />
                </div>
                <div class="cardproperties">
                    <xsl:apply-templates/>
                </div>
            </div>
        </div>
    </xsl:template>


    <xsl:template match="//card/value">
        <xsl:variable name="property" select="@id" />
        <xsl:variable name="propertyid" select="position()" />
        
        <div id="property-{$propertyid}" class="property">
            <span class="propertyname">
                <xsl:value-of select="//properties/value[tag = $property]/name" />
            </span>
            <span class="propertysuffix">
                <xsl:value-of select="//properties/value[tag = $property]/suffix" />
            </span>
            <span class="propertyvalue">
                <xsl:value-of select="." />
            </span>
        </div>
    </xsl:template>
    
    <!-- do not output everything -->
    <xsl:template match="text()|@*">

    </xsl:template>
    
</xsl:stylesheet>
