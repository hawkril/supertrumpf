package main

import (
	"encoding/xml"
	"html"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/gorilla/mux"

	"trumpf-core/event"
	"trumpf-core/lobby"
	"trumpf-core/players"
	_ "trumpf-core/trumpf"
)

type errorPayload struct {
	Message  string `xml:"message"`
	Redirect string `xml:"redirect,omitempty"`
}

const (
	INTERNAL_ERROR_XML = "<Event><type>error</type><source>system</source><payload><message>An internal server error occurred.</message></payload></Event>"
)

func main() {
	log.Println("Setting up routes.")
	router := mux.NewRouter()

	router.HandleFunc("/api/login/{user}", panicHandler(loginHandler))
	router.HandleFunc("/api/{session}/lobbies", panicHandler(lobbyHandler))
	router.HandleFunc("/api/{session}/lobbies/new/{name}/{max}", panicHandler(lobbyNewHandler))
	router.Handle("/", http.FileServer(http.Dir("static")))

	log.Fatal(http.ListenAndServe(":8088", router))
}

func loginHandler(rw http.ResponseWriter, req *http.Request) {
	logRequest(req)

	userName := mux.Vars(req)["user"]
	userName = strings.TrimSpace(userName)
	userName = html.EscapeString(userName)

	x := xml.NewEncoder(rw)
	x.Encode(event.NewEvent("session_id", "system", players.NewPlayer(userName)))
	x.Flush()
	log.Println("Request done")
}

func lobbyHandler(rw http.ResponseWriter, req *http.Request) {
	logRequest(req)

	session := mux.Vars(req)["session"]
	player := players.GetPlayer(session)
	x := xml.NewEncoder(rw)
	if player == nil {
		// User is not logged in (the session is invalid)
		if err := x.Encode(newErrorEvent("The session is invalid. Please log in first.", "/")); err != nil {
			log.Println(err)
		}
	} else {
		x.Encode(event.NewEvent("lobby_list", "system", lobby.GetLobbies()))
	}

	x.Flush()
	log.Println("Request done")
}

func lobbyNewHandler(rw http.ResponseWriter, req *http.Request) {
	logRequest(req)

	vars := mux.Vars(req)
	session := vars["session"]
	player := players.GetPlayer(session)

	x := xml.NewEncoder(rw)
	if player == nil {
		// User is not logged in (the session is invalid)
		if err := x.Encode(newErrorEvent("The session is invalid. Please log in first.", "/")); err != nil {
			log.Println(err)
		}
		x.Flush()
		return
	}

	name := vars["name"]
	max := vars["max"]
	maxInt64, err := strconv.ParseInt(max, 10, 32)
	if err != nil {
		if err := x.Encode(newErrorEvent("The max player number is not an integer.", "")); err != nil {
			log.Println(err)
		}
		x.Flush()
		return
	}

	x.Encode(event.NewEvent("lobby_created", "system", lobby.NewLobby(player, name, int(maxInt64))))
	x.Flush()
}

func newErrorEvent(message, redirect string) *event.Event {
	return event.NewEvent("error", "system", errorPayload{message, redirect})
}

func logRequest(req *http.Request) {
	log.Printf("- %s %s %s\n", req.Method, req.RemoteAddr, req.URL)
}

type panicHandler http.HandlerFunc

func (this panicHandler) ServeHTTP(rw http.ResponseWriter, req *http.Request) {
	defer func() {
		if recover() != nil {
			rw.Write([]byte(INTERNAL_ERROR_XML))
		}
	}()
	this(rw, req)
}
