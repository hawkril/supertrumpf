package main

import (
	"encoding/xml"
	"html"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/go-martini/martini"
	"github.com/martini-contrib/render"

	"trumpf-core/lobbies"
	"trumpf-core/players"
	_ "trumpf-core/trumpf"
)

type errorPayload struct {
	Message  string `xml:"message"`
	Redirect string `xml:"redirect,omitempty"`
}

func main() {
	port := ":80"
	if len(os.Args) < 2 {
		log.Println("No port specified, assuming 80")
	} else {
		port = os.Args[1]
	}

	m := martini.Classic()
	m.Use(render.Renderer(render.Options{IndentXML: true, PrefixXML: []byte(xml.Header)}))

	// Login handler
	m.Get("/api/login/:user", func(p martini.Params, r render.Render) {
		userName := p["user"]
		userName = strings.TrimSpace(userName)
		userName = html.EscapeString(userName)

		player := players.NewPlayer(userName)
		player.Lock()
		r.XML(http.StatusOK, newEnvelope(player.ID, "ok", player))
		player.Unlock()
	})

	// Lobbies handler
	m.Get("/api/:session/lobbies", func(p martini.Params, r render.Render) {
		sessionID := p["session"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		r.XML(http.StatusOK, newEnvelope(sessionID, "ok", lobbies.GetLobbies()))
	})

	// Create new lobby
	m.Get("/api/:session/lobbies/new/:name", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		name := p["name"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		name = strings.TrimSpace(name)
		if name == "" {
			r.XML(http.StatusMethodNotAllowed, newEnvelope(sessionID, "name_empty", nil))
			return
		}

		name = html.EscapeString(name)

		r.XML(http.StatusOK, newEnvelope(sessionID, "ok", lobbies.NewLobby(player, name, 10)))
	})

	// Change lobby name
	m.Get("/api/:session/:lobby/change_name/:name", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		name := p["name"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		name = strings.TrimSpace(name)
		if name == "" {
			r.XML(http.StatusMethodNotAllowed, newEnvelope(sessionID, "name_empty", nil))
			return
		}

		name = html.EscapeString(name)
		lobby.Lock()
		if !lobby.SetName(player, name) {
			lobby.Unlock()
			r.XML(http.StatusForbidden, newEnvelope(sessionID, "not_owner", nil))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, newEnvelope(sessionID, "ok", name))
	})

	// Change lobby set
	m.Get("/api/:session/:lobby/change_set/:set", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		set := p["set"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		set = strings.TrimSpace(set)
		if set == "" {
			r.XML(http.StatusMethodNotAllowed, newEnvelope(sessionID, "set_empty", nil))
			return
		}

		set = html.EscapeString(set)
		lobby.Lock()
		if !lobby.SetSet(player, set) {
			lobby.Unlock()
			r.XML(http.StatusForbidden, newEnvelope(sessionID, "not_owner", nil))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, newEnvelope(sessionID, "ok", set))
	})

	// Change num players
	m.Get("/api/:session/:lobby/change_num/:num", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]
		num := p["num"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		numPlayers, err := strconv.ParseInt(num, 10, 32)
		numPlayersInt := int(numPlayers)
		if err != nil || numPlayersInt <= 0 {
			r.XML(http.StatusMethodNotAllowed, newEnvelope(sessionID, "invalid_num", nil))
			return
		}

		lobby.Lock()
		if !lobby.SetNumPlayers(player, numPlayersInt) {
			lobby.Unlock()
			r.XML(http.StatusForbidden, newEnvelope(sessionID, "not_owner", nil))
			return
		}
		lobby.Unlock()

		r.XML(http.StatusOK, newEnvelope(sessionID, "ok", numPlayersInt))
	})

	// Join lobby
	m.Get("/api/:session/:lobby/join", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		lobby.Lock()
		if lobby.Full() {
			r.XML(http.StatusForbidden, newEnvelope(sessionID, "lobby_full", nil))
		} else {
			lobby.Join(player)
			r.XML(http.StatusOK, newEnvelope(sessionID, "joined_lobby", lobbyID))
		}
		lobby.Unlock()
	})

	// Leave lobby
	m.Get("/api/:session/:lobby/leave", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		lobby.Lock()
		lobby.Leave(player)
		r.XML(http.StatusOK, newEnvelope(sessionID, "left_lobby", lobbyID))
		lobby.Unlock()
	})

	// Lobby events
	m.Get("/api/:session/:lobby/events", func(p martini.Params, r render.Render) {
		sessionID := p["session"]
		lobbyID := p["lobby"]

		player := players.GetPlayer(sessionID)
		if player == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope("", "login_required", nil))
			return
		}

		lobby := lobbies.GetLobby(lobbyID)
		if lobby == nil {
			r.XML(http.StatusNotFound, newEnvelope(sessionID, "no_such_lobby", nil))
			return
		}

		lobby.RLock()
		if lobby.HasPlayer(player) == nil {
			r.XML(http.StatusMethodNotAllowed, newEnvelope(sessionID, "not_joined", lobbyID))
			lobby.RUnlock()
			return
		}
		lobby.RUnlock()

		player.RLock()
		ch := player.GetChannel("lobby_" + lobby.ID)
		player.RUnlock()

		t := time.NewTimer(5 * time.Minute)
		select {
		case ev := <-ch:
			r.XML(http.StatusOK, newEnvelope(sessionID, "event", ev))
			t.Stop()
		case <-t.C:
			r.XML(http.StatusOK, newEnvelope(sessionID, "event_timeout", nil))
		}
	})

	// Try serving a static file
	m.Get("/**", http.FileServer(http.Dir("static/")).ServeHTTP)

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
	Body interface{} `xml:"s:Body>body"`
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
