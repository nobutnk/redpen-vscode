const exec = require("child_process").exec;

export class RedpenError {
  private validator: string;
  private message: string;
  private position: [number, number, number, number];
  constructor(e) {
    const p = e["position"];
    this.validator = e["validator"];
    this.message = e["message"];
    this.position = [p["start"]["offset"], p["start"]["line"], p["end"]["offset"], p["end"]["line"]];
  }
  getValidator() {
    return this.validator;
  }
  getMessage() {
    return this.message;
  }
  getStartOffset() {
    return this.position[0];
  }
  getStartLine() {
    return this.position[1];
  }
  getEndOffset() {
    return this.position[2];
  }
  getEndLine() {
    return this.position[3];
  }
}

export class Redpen {
  static exec(filename) {
    filename = "/Users/takeo/Desktop/IoT-presentation.txt";
    const cmd = "redpen -r json2 " + filename;
    exec(cmd, function(err, stdout, stderr) {
      const json = JSON.parse(stdout);
      function parse(param) {
        let errs = [];
        if (param["errors"] !== undefined) {
          for (const p of param["errors"]) {
            errs = errs.concat(parse(p));
          }
        } else {
          return [new RedpenError(param)];
        }
        return errs;
      };
      const errors = parse(json[0]);

      console.log(errors);
    });
  }
}
