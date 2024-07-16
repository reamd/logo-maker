import { useEffect, useRef/* useState */ } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import './App.css';
import github from "./assets/github.svg";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ColorPicker } from "@/components/ui/color-picker";

const formSchema = z.object({
  themeColor: z.string().length(7, {
    message: 'theme color must be 7.'
  }),
  titleFontSize: z
    .number()
    .min(12, {
      message: "font size must be at least 12.",
    })
    .max(120, {
      message: "font size must be at most 120.",
    })
    .default(100),
  projectTitle: z.string().min(1, {
    message: "project name must be at least 1 character.",
  }),
  descFontSize: z.number()
    .min(12, {
      message: "font size must be at least 12.",
    })
    .max(50, {
      message: "font size must be at most 50.",
    })
    .default(50),
  projectDesc: z.string().min(1, {
    message: "project desc must be at least 1 character.",
  }),
});

interface IStroke {
  width: number;
  color: string;
}

interface IFillText {
  font: string;
  fillStyle: string;
  text: string;
}

type ISubFillText = Omit<IFillText, 'fillStyle'>;

function drawRoundedRect(ctx: CanvasRenderingContext2D, pos: [number, number, number, number, number], stroke: IStroke | null = null) {
  const [x, y, width, height] = pos;
  let radius = pos.pop() as number;
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  ctx.fill();
  // 如果需要边框，可以添加以下代码
  if (stroke) {
    const { color, width } = stroke;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

function fillText(ctx: CanvasRenderingContext2D, fillText: IFillText, width: number, y: number) {
  const { font, fillStyle, text } = fillText;
  ctx.font = font;
  ctx.fillStyle = fillStyle;

  // calculate text center align position
  const textWidth = ctx.measureText(text).width;
  const x = (width - textWidth) / 2;
  ctx.fillText(text, x, y);
}

function calcCanvasWidth(ctx: CanvasRenderingContext2D, title: ISubFillText, desc: ISubFillText): number {
  ctx.font = title.font;
  const titleWidth = ctx.measureText(title.text).width;
  ctx.font = desc.font;
  const descWidth = ctx.measureText(desc.text).width;
  let width: number;
  if (titleWidth + 40 > descWidth) {
    width = Math.round(titleWidth + 40 + 60);
  } else {
    width = Math.round(descWidth + 60);
  }
  return width;
}

function downloadCanvas(canvas: HTMLCanvasElement, projectName: string) {
  const imageURL = canvas.toDataURL('image/png').replace("image/png", "image/octet-stream");
  const link = document.createElement('a');
  link.download = `${projectName}_logo.png`;
  link.href = imageURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      themeColor: '#fec639',
      titleFontSize: 100,
      projectTitle: "LOGO MAKER",
      descFontSize: 50,
      projectDesc: "Unique Logo For Your Project",
    },
  });
  let ctx: CanvasRenderingContext2D | null = null;

  const draw = (titleText: string, descText: string, titleFontSize: number = 120, descFontSize: number = 50, themeColor = '#fec639', background = '#212121') => {
    if (canvasRef.current) {
      ctx = canvasRef.current.getContext('2d') as CanvasRenderingContext2D;
      ctx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      // title & desc constant
      const titleFont = `bold ${titleFontSize}px Tahoma, Arial, "Helvetica Neue", "Hiragino Sans GB", Simsun, sans-serif`;
      const descFont = `bold ${descFontSize}px Tahoma, Arial, "Helvetica Neue", "Hiragino Sans GB", Simsun, sans-serif`;

      const width = calcCanvasWidth(ctx, {
        font: titleFont,
        text: titleText,
      }, {
        font: descFont,
        text: descText,
      });
      const height = 330;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      console.log('canvas shape', width, height);

      // painting background
      const grd = ctx.createLinearGradient(0, 0, width, height);
      grd.addColorStop(0, themeColor);
      grd.addColorStop(0.5, '#ffffff');
      grd.addColorStop(1, themeColor);
      ctx.fillStyle = grd;
      drawRoundedRect(ctx,
        [0, 0, width - 4, height - 4, 30], {
        color: themeColor,
        width: 2,
      });

      // painting front-background
      const frontBgLeft = 30;
      const frontBgTop = 35;
      const frontBgX = width - 30 * 2;
      const frontBgY = 205;
      ctx.fillStyle = background;
      drawRoundedRect(ctx,
        [frontBgLeft, frontBgTop, frontBgX, frontBgY, 20]);

      // project name
      fillText(ctx, {
        font: titleFont,
        fillStyle: themeColor,
        text: titleText
      }, width, (frontBgTop + frontBgY + titleFontSize) / 2);

      // project description
      fillText(ctx, {
        font: descFont,
        fillStyle: '#000000',
        text: descText
      }, width, frontBgY + (height - frontBgY + descFontSize) / 2 + 4);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      const {
        titleFontSize,
        projectTitle,
        descFontSize,
        projectDesc,
        themeColor,
      } = form.getValues();
      draw(projectTitle, projectDesc, titleFontSize, descFontSize, themeColor);
    }
  }, []);

  const handleChange = () => {
    const { projectTitle, projectDesc, titleFontSize, descFontSize, themeColor } = form.getValues();
    draw(projectTitle, projectDesc, titleFontSize, descFontSize, themeColor);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const { projectTitle } = values;
    if (canvasRef.current) {
      downloadCanvas(canvasRef.current, projectTitle.replace(/\s{1,}/g, '_').toLowerCase());
    }
  };

  return (
    <div className="w-full h-screen">
      <div className='h-full flex p-4'>
        <div className='flex flex-auto items-center justify-center p-4 border-2 border-gray-200'>
          <canvas ref={canvasRef}></canvas>
        </div>
        <div className='bg-blue-100 flex-none w-1/3 p-4'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="themeColor"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Theme colors</FormLabel>
                    <FormControl>
                      <ColorPicker
                        onChange={(val) => {
                          onChange(val);
                          handleChange();
                        }}
                        value={value}
                      />
                    </FormControl>
                    <FormDescription>
                      Please choose your favorite color.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="titleFontSize"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Font Size - {value}px</FormLabel>
                    <FormControl>
                      <Slider
                        min={12}
                        max={120}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => {
                          onChange(vals[0]);
                          handleChange();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This is a font size for the project name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectTitle"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Project name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="please input project name"
                        defaultValue={[value]}
                        onChange={(val) => {
                          onChange(val);
                          handleChange();
                        }} />
                    </FormControl>
                    <FormDescription>
                      Support for continuous Spaces.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="descFontSize"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Font Size - {value}px</FormLabel>
                    <FormControl>
                      <Slider
                        min={12}
                        max={50}
                        step={1}
                        defaultValue={[value]}
                        onValueChange={(vals) => {
                          onChange(vals[0]);
                          handleChange();
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      This is a font size for the project description.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="projectDesc"
                render={({ field: { value, onChange } }) => (
                  <FormItem>
                    <FormLabel>Project description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="please input project description"
                        defaultValue={[value]}
                        onChange={(val) => {
                          onChange(val);
                          handleChange();
                        }} />
                    </FormControl>
                    <FormDescription>
                      Support for continuous Spaces.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Download</Button>
            </form>
          </Form>

          <div className="pt-8 text-gray-500">
            👏Take a look at the open source project <a className="text-blue-600" href="https://github.com/reamd/remove-bg/blob/main/README.md" target="_blank">
              <img className="w-4 inline-block" src={github} /> remove-bg</a>.
            It uses <a className="text-blue-600" href="https://github.com/reamd/logo-maker" target="_blank">
              <img className="w-4 inline-block" src={github} /> Logo Maker</a>.</div>
        </div>
      </div>
    </div>
  );
};

export default App;
