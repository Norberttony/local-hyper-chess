
const test_suite = {
    positions: [
        {
            name: "Starting position",
            fen: StartingFEN,
            moveCounts:             [1, 32, 944, 42738], // indices are depth, moveCounts are number of legal moves
            captureCounts:          [0,  0,   0,   162],
            piecesCapturedCounts:   [0,  0,   0,   162],
            checkmateCounts:        [0,  0,   0,     0]
        },
        {
            // the FEN of this position is courtesy of
            // https://carusos.org/Hyperchess/hyperchess.html
            name: "Chameleon-coordinator checkmate",
            fen: "k5R1/p7/8/8/7K/8/8/5B2 w -",
            moveCounts:             [1, 46, 608],
            captureCounts:          [0,  0,   1],
            piecesCapturedCounts:   [0,  0,   1],
            checkmateCounts:        [0,  3,   3]
        },
        {
            name: "White king-chameleon death squares with king move",
            fen: "unbqkbn1/pppppppp/3PPP2/3r1B2/8/8/PPP3PP/RNBQK1NU w 8",
            moveCounts:             [1, 63, 2067, 126668],
            captureCounts:          [0,  1,   83,   2549],
            piecesCapturedCounts:   [0,  1,   83,   2570],
            checkmateCounts:        [0,  0,    0,      0]
        },
        {
            name: "Black king-chameleon death squares with king move",
            fen: "un1q1kb1/pp1ppppn/P2PPP1p/4RB1b/8/2p4P/1PPK2P1/1NBQ2NU b 16",
            moveCounts:             [1, 41, 2889],
            captureCounts:          [0,  2,   52],
            piecesCapturedCounts:   [0,  2,   52],
            checkmateCounts:        [0,  0,    0]
        },

        // === STRADDLERS === //
        {
            /*
                rules enforced:
                - straddlers can capture any enemy piece with the custodial method (only checked with immobilizer and other straddlers)
            */
            name: "straddler custodial capture only after move made",
            fen: "p1P5/4p3/Pp2P2p/3Pp3/p1Pp4/1Pp2P2/P2u4/3Pp3 w -",
            moveCounts:             [1, 45, 2738],
            captureCounts:          [0,  8,  212],
            piecesCapturedCounts:   [0, 10,  216],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - chameleon CANNOT made diagonal move to capture like a straddler (must move LIKE a straddler)
                - chameleon can move to capture a straddler with another chameleon OR another straddler
                - chameleon cannot capture any other type of enemy piece with this method
                - again, straddlers and chameleons MUST do custodial capture
                - enemy piece can move between two straddlers. the straddler moving and then moving back would only then initiate capture.
            */
            name: "straddler and chameleon duo",
            fen: "p1PP1P2/4pp2/Pp2P2p/3Pp3/p1Pq1P2/1Bp2B2/P2p4/3Pp1p1 w -",
            moveCounts:             [1, 55, 3506],
            captureCounts:          [0, 12,  234],
            piecesCapturedCounts:   [0, 14,  236],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - two straddlers must be on the same team to work together
                - springers cannot make straddler-like captures, nor can be teamed up with another straddler
            */
            name: "straddlers only work with other friendly straddlers",
            fen: "p1P5/4p2N/Ppp1P2p/3Pp3/p1Pp4/1Pp2P1P/P2u4/3Pp2N w -",
            moveCounts:             [1, 59, 3206],
            captureCounts:          [0,  7,  359],
            piecesCapturedCounts:   [0,  9,  411],
            checkmateCounts:        [0,  0,    0]
        },
        {
            name: "straddler-chameleon duo and co (cannot work with them though)",
            fen: "p1PP1P2/4pp1N/Pp2P2p/3Pp3/p1Pq1P2/1Bp2B1B/P2p4/3Pp1p1 w -",
            moveCounts:             [1, 73, 4202],
            captureCounts:          [0, 13,  312],
            piecesCapturedCounts:   [0, 15,  314],
            checkmateCounts:        [0,  0,    0]
        },

        // === SPRINGER === //
        {
            /*
                rules enforced:
                - springer can capture by jumping over a piece and ending up on an empty square
                    directly after the enemy piece.
            */
            name: "springer test 1",
            fen: "4p3/1b2p3/6p1/5p2/1p1pN2p/8/2n1P3/7n w -",
            moveCounts:             [1, 19, 2016],
            captureCounts:          [0,  3,   60],
            piecesCapturedCounts:   [0,  3,   60],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - chameleon can only jump over springers
            */
            name: "chameleon-springer test",
            fen: "4p3/1b2p3/6p1/5p2/1p1pB2p/8/2n1P3/7n w -",
            moveCounts:             [1, 17, 1800],
            captureCounts:          [0,  1,   45],
            piecesCapturedCounts:   [0,  1,   45],
            checkmateCounts:        [0,  0,    0]
        },

        // === KING AND COORDINATOR === //
        {
            /*
                rules enforced:
                - king captures
                - king move OR coordinator move can initiate death squares
                - king and coordinator invoke TWO death squares AFTER move
                - death squares not formed after coordinator's death (need depth 2)
            */
            name: "king and coordinator basics",
            fen: "Pk5p/r7/8/8/p4R2/8/8/K4n1p w -",
            moveCounts:             [1, 23, 1258],
            captureCounts:          [0, 16,  104],
            piecesCapturedCounts:   [0, 18,  107],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - chameleon can act like a coordinator, form death squares with its own king,
                    but only against an enemy coordinator.
            */
            name: "king-chameleon duo",
            fen: "Pk5p/r6B/8/8/p4B2/8/8/K4n1p w -",
            moveCounts:             [1, 41, 2064],
            captureCounts:          [0,  9,  198],
            piecesCapturedCounts:   [0,  9,  198],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - chameleon can make a KING move to team up with its own coordinator and put the
                    ENEMY KING in check (cannot capture any other enemy pieces with this method)
            */
            name: "coordinator-chameleon duo",
            fen: "R5k1/8/8/B7/p3B3/8/8/K4n1P w -",
            moveCounts:             [1, 60, 1426],
            captureCounts:          [0,  1,   17],
            piecesCapturedCounts:   [0,  1,   17],
            checkmateCounts:        [0,  1,    1]
        },

        // === IMMOBILIZER === //
        {
            /*
                rules enforced:
                - when king is attacked (with checkmating potential), immobilizer can immobilize
                    the attacking piece
                - immobilized pieces cannot move or capture
            */
            name: "immobilizer checkmates",
            fen: "N4B1B/8/4k3/3u1U2/4K3/8/8/8 w -",
            moveCounts:             [1, 55, 784],
            captureCounts:          [0,  0,   0],
            piecesCapturedCounts:   [0,  0,   0],
            checkmateCounts:        [0,  1,   1]
        },
        {
            /*
                rules enforced:
                - immobilizer next to immobilizer keeps sphere of influences
            */
            name: "immobilized immobilizer",
            fen: "N4B1B/8/4k3/4uU2/4K3/8/8/8 w -",
            moveCounts:             [1, 38,  38],
            captureCounts:          [0,  0,   0],
            piecesCapturedCounts:   [0,  0,   0],
            checkmateCounts:        [0,  5,   5]
        },
        {
            /*
                rules enforced:
                - chameleon can immobilize an immobilizer (but not any other pieces)
                - the king can checkmate an immobilized enemy king
            */
            name: "chameleoned immobilizer",
            fen: "N4B1B/8/4k3/4bU2/4K3/8/8/8 w -",
            moveCounts:             [1, 45,  45],
            captureCounts:          [0,  1,   1],
            piecesCapturedCounts:   [0,  1,   1],
            checkmateCounts:        [0, 11,  11]
        },

        // === RETRACTOR === //
        {
            /*
                rules enforced:
                - Retractor cannot go off the board
                - Retractor must end up in an empty square
                - Retractor must capture an enemy piece by moving exactly one square away from it
            */
            name: "retractor",
            fen: "Qp6/pp6/8/3p1PQ1/3pQp2/3p4/8/8 w -",
            moveCounts:             [1, 27, 1276],
            captureCounts:          [0,  2,    4],
            piecesCapturedCounts:   [0,  2,    4],
            checkmateCounts:        [0,  0,    0]
        },
        {
            /*
                rules enforced:
                - A chameleon can capture a retractor
                - Same method does NOT work for other pieces
                - Accidentally tests if two chameleons can capture one straddler :)
            */
            name: "chameleon retractor",
            fen: "Bp6/pp6/8/p1qp1QB1/PBqpBp2/2qp4/8/8 w -",
            moveCounts:             [1, 43, 2245],
            captureCounts:          [0,  3,   81],
            piecesCapturedCounts:   [0,  3,   81],
            checkmateCounts:        [0,  0,    0]
        },

        // === CHAMELEON === //
        {
            name: "one move. five pieces. all captured.",
            fen: "k3r2K/8/8/4P3/4p3/2Pp1pP1/4B3/4q3 w -",
            moveCounts:             [1, 6, 246],
            captureCounts:          [0, 2,   2],
            piecesCapturedCounts:   [0, 6,   6],
            checkmateCounts:        [0, 0,   0]
        },
        {
            name: "woops",
            fen: "8/8/3k4/7R/4K3/8/8/8 b -",
            moveCounts:             [1],
            captureCounts:          [0],
            piecesCapturedCounts:   [0],
            checkmateCounts:        [0]
        }
        /* Blank template for copying and pasting
        {
            name: "",
            fen: "",
            moveCounts:             [1],
            captureCounts:          [0],
            piecesCapturedCounts:   [0],
            checkmateCounts:        [0]
        }
        */
    ],
};
