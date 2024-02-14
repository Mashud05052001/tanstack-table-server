import { MongoClient, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const uri = process.env.MONGODB_URL;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        // Collections
        const usersCollection = client.db("tanstack-table").collection("users");
        // Users Delete
        // app.delete("/users", async (req: Request, res: Response) => {
        //   const result = await usersCollection.deleteMany({});
        //   res.send(result);
        // });
        // Users get
        //    /users?sort=field_name&order=asc/desc&sort=......
        app.get("/users", async (req, res) => {
            let totalUsers = await usersCollection.countDocuments();
            const query = req?.query;
            // console.log(query, "mashud");
            // setup sorting condition
            let dataQuery = {};
            let options = {};
            if (query.filter) {
                const filterItems = query.filter.split(":");
                if (filterItems[0] === "age") {
                    dataQuery[filterItems[0]] = { $eq: parseInt(filterItems[1]) };
                }
                else {
                    dataQuery[filterItems[0]] = {
                        $regex: new RegExp(filterItems[1], "i"),
                    };
                }
                totalUsers = await usersCollection.countDocuments(dataQuery);
            }
            if (query.sort) {
                options.sort = {};
                const sortingArray = query?.sort?.split(",");
                sortingArray.forEach((item) => {
                    const singleSortArray = item.split(":");
                    const field_name = singleSortArray[0], field_value = singleSortArray[1] === "asc" ? 1 : -1;
                    options.sort[field_name] = field_value;
                });
            }
            const users = await usersCollection
                .find(dataQuery, options)
                .skip(parseInt(query?.skip) || 0)
                .limit(parseInt(query?.size) || 10)
                .toArray();
            res.send({ data: users, count: totalUsers });
        });
        app.get("/", (req, res) => {
            res.send({ message: "The Server Is Running", status: "successfull" });
        });
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }
    finally {
    }
}
run().catch(console.dir);
