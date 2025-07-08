
# Hyper Chess Website

The [Hyper Chess website](norberttony.github.io/local-hyper-chess/) is specifically designed for a chess variant of Ultima Chess, known as Hyper Chess. The [linked website](https://www.carusos.org/Hyperchess/hyperchess.html) provides the rules of Hyper Chess. The non-MIT rules (where the death squares formed by the king and coordinator do not persist) are used. This website allows users to analyze their hyper chess games using an engine, play against other players or against the engine, and solve puzzles.

## Design
The website was designed as a Single Page Application (SPA) because of the simple set of features and repeated use of the same files and code. There are 4 states (that can be thought of as separate pages) that handle the Lobby, Game View, Analysis Board, and Puzzles. Using a SPA saves on latency when switching between these states, especially when no new content has to be loaded from the server (which is often the case). A server implementation was never intended, but currently exists outside of this repository as a public-facing API endpoint that resolves GET and POST requests accordingly. Since it is incredibly slow, accounts were not implemented (security concern) and the client code often uses localStorage in order to cache data received from the server.

Board widgets listen to events dispatched by the board to perform the necessary user interface updates. By operating in an Observer pattern, the board state does not have to communicate to each widget individually but can instead send an equivalent message to all widgets. This decoupling allows any number of widgets to be enabled or disabled at any time. This behavior is preferred, since the state transitions often involve turning on/off certain widgets.

![2025-07-08 13 56 00 localhost 63c95821f920](https://github.com/user-attachments/assets/5927c178-6ea5-47de-b652-ca8441667a92)
This behavior can be seen in the Lobby, displayed above. The Featured Game is a Board that only contains a "Network Widget," which listens for any new updates about the game from the server. Because there is no "PGN Viewer Widget," it is not possible to scroll through the moves of the game, but this is intended for the Featured Game. The developer/programmer may choose any widgets they want based on the features they want the board to have.

## Game Analysis

![hyper-chess-analysis](https://github.com/user-attachments/assets/08921001-20cc-4255-9a85-9a77047625c6)
The engine is loaded using the WebAssembly build of [this project](https://github.com/Norberttony/hyper-chess-engine). There is a wrapper class that handles UCI protocol communication, so as long as any given Hyper Chess engine implements the UCI protocol (and has a web build that does not block the main thread when using I/O) it could be substituted in programmatically.

## Puzzles

![hyper-chess-puzzle](https://github.com/user-attachments/assets/51d0e6a9-f81d-48e7-b2e1-cd21513fdae7)
The puzzles tab allows the user to try and find the winning move for the current side to play. Feedback is provided based on the user's choice, at times an opponent's refutation is provided to an incorrectly selected move. Puzzles are designed so that there is a single solution. There is verification code that ensures all of the puzzles have valid moves in place, and there exists a [separate repository](https://github.com/Norberttony/puzzle-scout) where puzzles are generated and verified.
