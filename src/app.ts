import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { mainRoute } from "./routes/routes";

const app: Application = express();

// parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// security
app.use(helmet());

// cors
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

// logger
app.use(morgan("dev"));

app.use("/api/v1", mainRoute);

// health route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "GI Bangladesh Backend Running Successfully",
  });
});

// not found handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route Not Found",
  });
});

export default app;
