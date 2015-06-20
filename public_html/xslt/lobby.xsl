<?xml version="1.0" encoding="UTF-8"?>

<!--
    Document   : lobby.xsl
    Created on : 15. Juni 2015, 05:06
    Author     : Clemens
    Description:
        Purpose of transformation follows.
-->

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:template match="/">
        <xsl:variable name="numPlayers"><xsl:value-of select="//body/numPlayers"/></xsl:variable>
        <xsl:variable name="lobbyname"><xsl:value-of select="//body/name"/></xsl:variable>
        
        <div id="mainbox" class="lobby">
            <div id="header"><xsl:value-of select="//body/name" />: warte auf weitere Spieler...</div>
            <div id="main">
                <div id="leftbox">
                    <xsl:if test="//session = //owner/id">
                        <div>Spielname: <input type="text" class="form-control" id="gamename" placeholder="{$lobbyname}" /><button type="button" class="btn btn-default" id="changename">Ändern</button></div>
                    </xsl:if>
                    <div>Maximale Spieler: <xsl:value-of select="//numPlayers" /> 
                        <xsl:if test="//session = //owner/id">
                            <input id="maxplayers" data-slider-id='maxplayersSlider' type="text" data-slider-min="0" data-slider-max="20" data-slider-step="1" data-slider-value="{$numPlayers}"/>
                            <button type="button" class="btn btn-default" id="changenum">Ändern</button>
                        </xsl:if>
                    </div>
                    <div>Erstellt von: <xsl:value-of select="//owner/name" /></div>
                    <div>Kartenset:</div>
                </div>
                <div id="rightbox">
                    <div id="players">
                        <xsl:apply-templates />
                    </div>
                </div>
            </div>
            <div id="footer">
                <button type="button" class="btn btn-warning" id="leavegame">Spiel verlassen</button>
                <xsl:if test="//session = //owner/id">
                    <button type="button" class="btn btn-success" id="startgame">Spiel starten</button>
                </xsl:if>
            </div>
        </div>
    </xsl:template>

    <xsl:template match="//player">
        <div class="player"><xsl:value-of select="name" /></div>
    </xsl:template>

    <!-- do not output everything -->
    <xsl:template match="text()|@*">
    </xsl:template>

</xsl:stylesheet>
