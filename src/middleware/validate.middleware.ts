import { Request, Response, NextFunction } from "express";
import { AnyObjectSchema } from "yup";

export const validate =
  (schema: AnyObjectSchema) =>
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);

    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (err: any) {
      const errors = err.inner?.map((e: any) => ({
        field: e.path,
        message: e.message,
      })) || [{ field: err.path, message: err.message }];

      return res.status(400).json({ errors });
    }
  };
