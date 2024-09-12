
// SPOILER ALERT!!!!!
// uh oh watch out! the solutions to the puzzles are not encrypted or hidden in any way whatsoever!


const PUZZLES = [
    {
        // titles are always visible to the user
        title: "WTP Mate in 2",

        // fen is initial puzzle state
        fen: "2b1kb2/upU2np1/r1p5/7B/P4QBP/7N/2PPPP2/1P4K1 w 45",

        // difficulty is a vague category: easy, intermediate, or hard
        difficulty: "intermediate",

        // solution to the puzzle, the line of best play
        solution: ["Bd7", "Kxd7", "Bxe8"],

        // opponent's responses to suboptimal moves
        responses: [
            // responses to moves other than Bd7
            {},
            // responses to moves other than Kxd7 (redundant)
            {},
            // responses to moves other than Bxe8
            {"Qd6": ["Rxb6"]}
        ]
    },
    {
        title: "BTP Mate in 2",
        fen: "4k2b/b3pp2/3n2r1/pp2p1p1/n7/1PP1q1K1/1PuP3N/RNBQ1B1U b 57",
        difficulty: "hard",
        solution: ["Qf3", "Ug2", "Be3"],
        responses: [
            {
                "Rd3": ["Kxg4", {"Bg7": ["Ue4"], "Bg8": ["Ue4"]}],
                "Bg7": ["Kg2", {"Qf2": ["Kxf2"]}],
                "Bg8": ["Kg2", {"Qf2": ["Kxf2"]}]},
            {},
            {"Rd3": ["Kxg4"], "Bg7": ["Bd3"], "Bg8": ["Bd3"]}
        ]
    },
    {
        title: "BTP Mate in 1",
        fen: "k7/p3pp2/8/1p2b1p1/r2B4/6K1/4q3/5P1n b 78",
        difficulty: "easy",
        solution: ["Bg7"],
        responses: [
            {
                "Qf3": ["Be3"],
                "Ra3": ["Bxa4"],
                "Rb3": ["Bxb4"]
            }
        ]
    },
    {
        title: "BTP Mate in 2",
        fen: "5bn1/2p2kp1/8/pp3ppp/P2N2PP/6R1/rPP4P/2B1KB1N b 29",
        difficulty: "intermediate",
        solution: ["Ke7", "Kd1", "Bd8"],
        responses: [
            {
                "Ke8": ["Kd1", "Bd6", "Nxd7"],
                "Rxb1": ["Rxb3"],
                "Rxa1": ["Rxa3"]
            },
            {},
            {}
        ]
    },
    {
        title: "WTP Mate in 2",
        fen: "1n1bkN2/2pb2Q1/8/pq4p1/P4PPp/7U/P2B1P2/1K6 w 32",
        difficulty: "easy",
        solution: ["Qe7", "Be6", "Bd7"],
        responses: [
            {
                "Qf7": ["Pg6", {"Qe7": ["Pe6"], "Bd6": ["Nc8", "Be7"]}]
            }
        ]
    },
    {
        title: "BTP Mate in 2",
        fen: "7k/4ppbr/5Un1/pp1P4/RP4PP/1P6/1PuP2P1/2BKBb2 b 50",
        difficulty: "intermediate",
        solution: ["Rg8", "Pd8", "Re8"],
        responses: [
            {"Be2": ["Pxf2"]},
            {},
            {}
        ]
    },
    {
        title: "BTP Mate in 2",
        fen: "2bqk3/3p4/rp1b4/p5p1/P1BQ3N/R7/7P/3K4 b 47",
        difficulty: "hard",
        solution: ["Rb5", "Rb3", "Rf5"],
        responses: [
            {
                "Rb7": ["Bd5", {"Pc6": ["Rb4", "Rb5", "Qc4"], "Pba6": ["Rb4", "Rb5", "Qc4"]}],
                "Ra8": ["Bd5", "Rc6", "Kc2"]
            },
            {},
            {}
        ]
    },
    {
        title: "BTP Mate in 2",
        fen: "2b2bn1/1p1P3r/2p5/p1p1p3/PPU2k2/1N6/2P1P3/B2QK3 b 33",
        difficulty: "intermediate",
        solution: ["Rh1", "Kd2", ["Bfd8", "Bd6"]],
        responses: [
            // Rh1
            {},
            {},
            // Bfd8 or Bd6
            {
                "Bcd8": ["Kc3"]
            }
        ]
    },
    {
        title: "WTP Mate in 2",
        fen: "6k1/2R5/6rb/p2P1BUp/PP4P1/2p5/5K1b/8 w 102",
        difficulty: "hard",
        solution: ["Bf8", "Kh7", "Bg7"],
        responses: [
            {
                "Bf7": ["Kh8", "Bg7", "Kxh7"],
            },
            {},
            {}
        ]
    },
    {
        title: "WTP Mate in 2",
        fen: "1nbqkb2/p1ppp1p1/1uPP1R2/pP3N2/5p1r/pQ5n/5PPP/2B1KBNU w 14",
        difficulty: "intermediate",
        solution: ["Rh6", "Ph7", "Qf7"],
        responses: [
            // Rh6
            {
                "Bc8": ["Kh7"]
            },
            {},
            // Qf7
            {
                "Rxg7": ["Kf7"]
            }
        ]
    },
    {
        title: "BTP Mate in 3",
        fen: "N1bk1b2/p1p2r2/8/pp4pp/3P3U/4KP2/n2BP2P/R1nQ1B2 b 40",
        difficulty: "hard",
        solution: ["Ba3", "Ke4", "Bd3", "Kxe5", ["Ke7", "Bf5", "Nxe3"]],
        responses: [
            // Ba3
            {},
            {},
            // Bd3
            {
                "Ncb1": ["Kxe3"],
                "Nab1": ["Kxe3"],
                "Nxe3": ["Kxe3"]
            },
            {},
            {
                "Ke8": ["Kf6"]
            }
        ]
    },
    {
        title: "WTP Mate in 2",
        fen: "b2k1r2/6N1/2bB4/pp5p/P4QP1/8/2P5/2K2B2 w 67",
        difficulty: "intermediate",
        solution: ["Bc7", "Ke8", "Bd7"],
        responses: [
            {
                "Bd7": ["Rxe7", "Nxd7", "Kxd7"]
            },
            {},
            {
                "Qf7": ["Bg6"]
            }
        ]
    },
    {
        title: "BTP and mate in 3",
        fen: "3qkbnr/p2ppp1p/1p6/4n1pP/P1b5/R5U1/2P1PPPN/1NBQ1K1B b 11",
        difficulty: "hard",
        solution: [ "Nxe1", "Kg1", "Ra1", "Rxa2", "Bf1" ],
        responses: [
            // Nxe1
            {},
            {},
            // Ra1
            {
                "Bf1": [ "Rxf3" ],
                "Bg7": [ "Rxe3" ],
                "Bg4": [ "Pd4" ]
            },
            {},
            // Bf1
            {}
        ]
    }
    // GENERIC FORMAT
    /*
    {
        title: "",
        fen: "",
        difficulty: "",
        solution: [],
        responses: []
    },
    */
];
