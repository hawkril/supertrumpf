package main

import (
	"encoding/xml"
	"html"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"

	"trumpf-core/lobby"
	"trumpf-core/players"
	_ "trumpf-core/trumpf"
)

type errorPayload struct {
	Message  string `xml:"message"`
	Redirect string `xml:"redirect,omitempty"`
}

const (
	INTERNAL_ERROR_XML = "<wvent><type>error</type><source>system</source><payload><message>An internal server error occurred.</message></payload></event>"
)

func main() {
	port := ":80"
	if len(os.Args) < 2 {
		log.Println("No port specified, assuming 80")
	} else {
		port = os.Args[1]
	}

	m := martini.Classic()
	m.Use(render.Renderer(render.Options{PrefixXML: []byte(xml.Header)}))

	// Login handler
	m.Get("/api/login/:user", func(p martini.Params, r render.Render) {
		userName := p["user"]
		userName = strings.TrimSpace(userName)
		userName = html.EscapeString(userName)

		player := players.NewPlayer(userName)
		player.RLock()
		r.XML(http.StatusOK, newEnvelope(player.ID, "ok", player))
		player.Seen()
		player.RUnlock()
	})

	// Lobbies handler
	m.Get("/api/:session/lobbies", func(p martini.Params, r render.Render) {
		session := p["session"]

		player := players.GetPlayer(session)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		r.XML(http.StatusOK, newEnvelope(session, "ok", lobby.GetLobbies()))
	})

	// Create new lobby
	m.Get("/api/:session/lobbies/new/:name", func(p martini.Params, r render.Render) {
		session := p["session"]
		name := p["name"]

		player := players.GetPlayer(session)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		name = strings.TrimSpace(name)
		if name == "" {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "name_empty", nil))
			return
		}

		name = html.EscapeString(name)

		r.XML(http.StatusOK, newEnvelope(session, "ok", lobby.NewLobby(player, name, 10)))
	})

	m.RunOnAddr(port)
}

type envelope struct {
	XMLName xml.Name `xml:"s:Envelope"`
	NS      string   `xml:"xmlns:s,attr"`
	Header  struct {
		Session string    `xml:"session"`
		Time    time.Time `xml:"time"`
		Type    string    `xml:"type"`
	} `xml:"s:Header"`
	Body interface{} `xml:"s:Body"`
}

func newEnvelope(session, typ string, body interface{}) *envelope {
	return &envelope{
		NS: "http://www.w3.org/2003/05/soap-envelope",
		Header: struct {
			Session string    `xml:"session"`
			Time    time.Time `xml:"time"`
			Type    string    `xml:"type"`
		}{
			Session: session,
			Time:    time.Now(),
			Type:    typ,
		},
		Body: body,
	}
}
