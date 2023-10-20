import { message } from "antd"
import ClipboardJS from "clipboard"
import { TailwindColorDepth, TailwindColorName, tailwindColorNames, tailwindColors } from "gskj-tools"

import { FC, useEffect, useRef, useState } from "react"
import { Socket, io } from "socket.io-client"

function keyof<T extends {}>(object: T) {
    return Object.keys(object) as (keyof T)[]
}

interface ColorProps {
    color: TailwindColorName
    depth: TailwindColorDepth
    fontColor: string
    onClick?: () => void
}

const ColorPad: FC<ColorProps> = props => {
    const { color, depth, fontColor, onClick } = props

    return (
        <button className="flex flex-col gap-0.5 items-center text-sm" onClick={onClick}>
            <div className="w-20 h-10 rounded" style={{ backgroundColor: tailwindColors[color][depth] }}></div>
            <div className="text-slate-900">{depth}</div>
            <div style={{ color: fontColor }}>{tailwindColors[color][depth]}</div>
        </button>
    )
}

const reg = /^\#[0-9A-F]{6}$/i

function isHexColor(str: string) {
    return reg.test(str)
}

function hex2rgb(str: string) {
    str = str.slice(1)
    return `rgb(${parseInt(str.slice(0, 2), 16)}, ${parseInt(str.slice(2, 4), 16)}, ${parseInt(str.slice(4, 6), 16)})`
}

function hex2rgba(str: string) {
    str = str.slice(1)
    return `rgba(${parseInt(str.slice(0, 2), 16)}, ${parseInt(str.slice(2, 4), 16)}, ${parseInt(str.slice(4, 6), 16)}, 1)`
}

interface ServerToClientEvents {
    color: (color: string, depth: number) => void
}

interface ClientToServerEvents {
    color: (color: string, depth: number) => void
}

const App: FC = () => {
    const [showColor, setShowColor] = useState<TailwindColorName>("slate")
    const [showDepth, setShowDepth] = useState<TailwindColorDepth>(50)
    const [backgroundColor, setBackgroundColor] = useState("#FFFFFF")
    const [fontColor, setFontColor] = useState("#64748B")
    const [server, setServer] = useState("")
    const socket = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)

    useEffect(() => {
        new ClipboardJS("[data-copy-btn]")

        return () => {
            socket.current?.disconnect()
        }
    }, [])


    function connect() {
        socket.current?.disconnect()
        socket.current = io(server)
        socket.current?.on("connect", () => {
            message.success("连接服务器成功")
        })
        socket.current?.on("connect_error", error => {
            message.error("连接服务器失败")
            console.warn(error)
        })
        socket.current?.on("color", (color, depth) => {
            console.log(color, depth)
        })
    }

    function clickColor(color: TailwindColorName, depth: TailwindColorDepth) {
        setShowColor(color)
        setShowDepth(depth)
        socket.current?.emit("color", color, Number(depth))
    }

    return (
        <div className="w-screen h-screen overflow-y-scroll p-16">
            <div className="absolute flex flex-col gap-2 p-4">
                <div className="flex gap-1 items-center">
                    <div className="flex gap-1 flex-auto">
                        <input placeholder="请输入服务器地址" value={server} onChange={e => setServer(e.target.value)} className="border border-solid border-slate-300 focus:outline-none px-2 w-full" />
                    </div>
                    <div className="flex items-center flex-none">
                        <button className="px-1" onClick={connect}>
                            连接
                        </button>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <div>背景颜色：</div>
                    <div className="flex gap-1">
                        <input value={backgroundColor} onChange={e => setBackgroundColor(e.target.value.toUpperCase())} type="color" />
                        <input value={backgroundColor} onChange={e => isHexColor(e.target.value.trim()) && setBackgroundColor(e.target.value.trim().toUpperCase())} className="border border-solid border-slate-300 focus:outline-none px-2 w-32" />
                    </div>
                    <div className="flex items-center">
                        <button className="px-1" onClick={() => setBackgroundColor("#FFFFFF")}>
                            重置
                        </button>
                    </div>
                </div>
                <div className="flex gap-1 items-center">
                    <div>字体颜色：</div>
                    <div className="flex gap-1">
                        <input value={fontColor} onChange={e => setFontColor(e.target.value.toUpperCase())} type="color" />
                        <input value={fontColor} onChange={e => isHexColor(e.target.value.trim()) && setFontColor(e.target.value.trim().toUpperCase())} className="border border-solid border-slate-300 focus:outline-none px-2 w-32" />
                    </div>
                    <div className="flex items-center">
                        <button className="px-1" onClick={() => setFontColor("#64748B")}>
                            重置
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex justify-center">
                <div className="flex flex-col gap-4 p-4 rounded-lg overflow-hidden" style={{ backgroundColor }}>
                    {keyof(tailwindColors).map(color => (
                        <div key={color} className="flex gap-8">
                            <div className="w-20 flex flex-col justify-center items-center font-black gap-1" style={{ color: tailwindColors[color][500] }}>
                                <div>{color}</div>
                                <div>{tailwindColorNames[color]}</div>
                            </div>
                            <div className="flex gap-2">
                                {keyof(tailwindColors[color]).map(depth => (
                                    <ColorPad key={depth} color={color} depth={depth as unknown as TailwindColorDepth} fontColor={fontColor} onClick={() => clickColor(color, depth as unknown as TailwindColorDepth)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="absolute right-16 top-16 flex flex-col gap-2 w-80 p-4">
                <div className="flex h-8 rounded overflow-hidden" style={{ backgroundColor: tailwindColors[showColor][showDepth] }}></div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" onClick={() => (setBackgroundColor(tailwindColors[showColor][showDepth]), message.success("设置成功"))}>
                        设为背景颜色
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" onClick={() => (setFontColor(tailwindColors[showColor][showDepth]), message.success("设置成功"))}>
                        设为字体颜色
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={`text-${showColor}-${showDepth}`} onClick={() => message.success("复制成功")}>
                        text-{showColor}-{showDepth}
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={`bg-${showColor}-${showDepth}`} onClick={() => message.success("复制成功")}>
                        bg-{showColor}-{showDepth}
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={`border-${showColor}-${showDepth}`} onClick={() => message.success("复制成功")}>
                        border-{showColor}-{showDepth}
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={tailwindColors[showColor][showDepth].toUpperCase()} onClick={() => message.success("复制成功")}>
                        {tailwindColors[showColor][showDepth].toUpperCase()}
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={`${tailwindColors[showColor][showDepth].toUpperCase()}FF`} onClick={() => message.success("复制成功")}>
                        {tailwindColors[showColor][showDepth].toUpperCase()}FF
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={hex2rgb(tailwindColors[showColor][showDepth])} onClick={() => message.success("复制成功")}>
                        {hex2rgb(tailwindColors[showColor][showDepth])}
                    </button>
                </div>
                <div className="flex h-8 rounded overflow-hidden">
                    <button data-copy-btn className="w-full bg-slate-200 p-1" data-clipboard-text={hex2rgba(tailwindColors[showColor][showDepth])} onClick={() => message.success("复制成功")}>
                        {hex2rgba(tailwindColors[showColor][showDepth])}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default App
