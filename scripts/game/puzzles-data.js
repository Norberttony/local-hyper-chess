
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
        title: "WTP Mate in 2",
        fen: "2q2b1k/2p3p1/b2N3p/1p1R4/PPN3PP/8/4BP2/2B3K1 w 53",
        difficulty: "intermediate",
        solution: ["Be8", "Kh7", "Bh5"],
        responses: [
            {
                "Rh5": ["Bxf5"]
            },
            {},
            {
                "Rh5": ["Bxf5"],
                "Kh2": ["Kg6"],
                "Kh1": ["Kg6"]
            }
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
    /* multiple solutions D:
    {
        title: "BTP Mate in 2",
        fen: "5b2/2p1p1p1/8/2P1k1pp/1PB1n3/8/3K4/2B2b2 b 35",
        difficulty: "Intermediate",
        solution: ["Bd3", "Kd1", "Be2"],
        responses: [
            {
                "Be2": ["Kc3", "Nb3", "Kb2", "Bc2", "Ka1"]
            },
            {},
            {}
        ]
    },
    */
    {
        title: "BTP Mate in 2",
        fen: "2b2bn1/1p1P3r/2p5/p1p1p3/PPU2k2/1N6/2P1P3/B2QK3 b 33",
        difficulty: "Intermediate",
        solution: ["Rh1", "Kd2", "Bfd8"],
        responses: []
    },

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
