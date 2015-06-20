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
        <div id="mainbox" class="lobby">
            <div id="header"><xsl:value-of select="//body/name" />: warte auf weitere Spieler...</div>
            <div id="main">
                <div>Anzahl Spieler: <xsl:value-of select="//numPlayers" /></div>
                <div>Spieler von: <xsl:value-of select="//owner/name" /></div>
            </div>
            <div id="footer">
                <button type="button" class="btn btn-warning" id="leavegame">Spiel verlassen</button>
                <xsl:if test="session = //owner/id">
                    <button type="button" class="btn btn-success" id="startgame">Spiel starten</button>
                </xsl:if>
            </div>
        </div>
    </xsl:template>

</xsl:stylesheet>
