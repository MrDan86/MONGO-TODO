import express from "express";
import bodyParser from "body-parser";
import mongoose from 'mongoose';
import lodash from "lodash";

//Mongoose-Verbindung
mongoose.connect('mongodb+srv://admin-dan:Prometheus86@cluster0.oyoeflq.mongodb.net/todolistDB');


const app = express();
const port = 3000;
let lastDate;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

//  1. Schema erstellen mit Parametern
const notizenSchema = new mongoose.Schema({
    
    notiztext: String,
  });

//  2. Model-Konstruktor aus dem Schema erstellen für einzelnen Datensatz Notiz
const Notiz = mongoose.model("Notiz", notizenSchema);

//1.1. dynamische Liste
const listenSchema = {
    listenTitel: String,
    items: [notizenSchema]
};

const List = mongoose.model("List", listenSchema);

const notiz1 = new Notiz ({
    
    notiztext: "Test1"
});

const notiz2 = new Notiz ({
    
    notiztext: "Test2"
});

const standard = [notiz1, notiz2];

//###Routen

//  1. GET-ROUTE MONGOOSE
app.get("/", async function (req, res) {

    await Notiz.find({}) // Datenbankabfrage aus DB Notiz: alle Daten ohne Filter werden zurückgegeben
//   .then(notizen => {
//     if (notizen.length === 0) {
//       Notiz.insertMany(standard);
//       console.log("Erfolgreich");
//       res.redirect("/");
//     } else {
    .then(notizen => {
    res.render("index.ejs", {
      listenTitel: "Today",
      Notizen: notizen // Annahme: notizen enthält die gefundenen Notizen aus der Datenbankabfrage
    })});
//   })
//   .catch(err => {
//     console.error("Fehler beim Laden der Notizen:", err);
//     res.status(500).send("Fehler beim Laden der Notizen.");
//   });

});
//  2. POST-ROUTE FÜR TODAY UND DYNAMISCH
app.post("/", async function (req, res) {
   
    const notizenName = req.body.notizText;
    const listenName = req.body.notiztext;
  
    const notiz = new Notiz({
      notiztext: notizenName,
    });
    
    if (listenName === "Today") {
            notiz.save();
            res.redirect("/");
      } else {
        List.findOne({ listenTitel: listenName })
        .then(liste => {
            liste.items.push(notiz);
            liste.save();
            res.redirect("/" + listenName);
      })
      .catch(err => {
        console.error("Fehler beim Speichern der Notizen:", err);
        res.status(500).send("Fehler beim Speichern der Notizen");
      });
    }
});
  
//3.POST_ROUTE DELETE FÜR TODAY UND DYNAMISCH
app.post("/delete", async function (req, res) {
    const deleteId = req.body.button;
    const deleteListe = req.body.listenName;
;
    if (deleteListe === "Today") {
        Notiz.findByIdAndRemove({ _id: deleteId })
        .then(notiz =>
            console.log("Notiz wurde gelöscht:", notiz)
            )
        res.redirect("/")
    } else {  
        List.findOneAndUpdate(
                        { listenTitel: deleteListe },
                        { $pull: {items: { _id: deleteId } } } 
                    )
        .then(notiz_ =>
            console.log("Notiz wurde gelöscht:", notiz_)
            )
        res.redirect("/" + deleteListe);
                }
});

//4.DYNAMISCHE ROUTE FÜR NEUE LISTEN
app.get("/:dynamischeListen", function (req, res) {

    const dynamischeListen = lodash.capitalize(req.params.dynamischeListen);

    List.findOne({listenTitel: dynamischeListen})
    .then(liste => {

        if(!liste) {//neue Liste erstellen, wenn keine vorhanden ist
            const neueListe = new List({
                listenTitel: dynamischeListen,
                items: standard
            });
        neueListe.save();
        res.redirect("/" + dynamischeListen);

        } else {//redirect zur Seite mit Inhalt
                res.render("index.ejs", {
                    listenTitel: liste.listenTitel, 
                    Notizen: liste.items
                })
        }
    })
    .catch(err => {
        console.error("Fehler beim Suchen der Liste:", err);
        res.status(500).send("Fehler beim Suchen der Liste");
      });

});

app.listen(port, function() {
    console.log("Server is running on port " + port);
});