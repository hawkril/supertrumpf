<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:param name="active" />
    <xsl:variable name="property" select="//payload/property" />
    
    <xsl:template match="//payload">
        <div class="game_move">
            <xsl:variable name="path" select="card_pic" />
            
        </div>
    </xsl:template>

    <xsl:template match="card">
        <div class="card_move">
            <div class="card_title">
                <xsl:value-of select="titel" />
            </div>
            <div class="card_image">
                <xsl:variable name="path" select="card_pic" />
                <img src="{$path}" />
            </div>
            <div class="card_value">
                <xsl:value-of select="value[$property]" />
            </div>
        </div>
    <xsl:template>
    
    <!-- do not output everything -->
    <xsl:template match="text()|@*">

    </xsl:template>
    
</xsl:stylesheet>
