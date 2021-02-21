namespace ReadFileArgs {
  interface BaseAs {
    readonly blob: Blob;
  }

  export interface AsArrayBuffer extends BaseAs {
    readonly type: "AS_ARRAY_BUFFER";
  }

  export interface AsText extends BaseAs {
    readonly encoding?: "UTF-8";
    readonly type: "AS_TEXT";
  }
}

type ReadFileArgs = ReadFileArgs.AsArrayBuffer | ReadFileArgs.AsText;

interface ReadFile {
  (args: ReadFileArgs.AsArrayBuffer): Promise<ArrayBuffer | undefined>;
  (args: ReadFileArgs.AsText): Promise<string | undefined>;
}

export const readFile: ReadFile = (args: ReadFileArgs) => {
  return new Promise<any | undefined>((resolve) => {
    const fileReader = new FileReader();
    fileReader.onloadend = ({ target }) => resolve(target?.result);

    switch (args.type) {
      case "AS_ARRAY_BUFFER":
        fileReader.readAsArrayBuffer(args.blob);
        break;

      case "AS_TEXT":
        fileReader.readAsText(args.blob, args.encoding || "UTF-8");
        break;
    }
  });
};
