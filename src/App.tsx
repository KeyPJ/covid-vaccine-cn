import React, {useEffect, useState} from 'react';
import './App.css';
import ReactECharts from 'echarts-for-react';
import {Data, DayData} from "./@type/data";
import {useWinSize} from "./hooks/useWinSize";

function App() {

    const [data, setData] = useState<Data>({
        xData: [],
        ySumData: [],
        yIncrementData: [],
        ySumMax: 0,
        yIncrementMax: 0,
        urls:[],
    })

    const ySumInterval = 30000;
    const yIncrementInterval = 500;

    const option = {
        title: [{
            text: '新冠病毒疫苗接种情况',
            subtext: "数据来自国家卫健委\n注:数据日期为发布日期,数据实际为截至前一日的数据\n.双击数据可以打开卫健委对应的发布页.",
            sublink: "http://www.nhc.gov.cn/xcs/yqjzqk/list_gzbd.shtml",
            left: 'center',
            top: 0,
            textStyle: {
                fontWeight: 'normal',
                fontSize: 20
            }
        }],
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            }
        },
        toolbox: {
            feature: {
                dataView: {show: true, readOnly: false},
                magicType: {show: true, type: ['line', 'bar']},
                saveAsImage: {show: true}
            }
        },
        legend: {
            data: ['累计剂次', '每日增量'],
            top: "20%"
        },
        xAxis: [
            {
                type: 'category',
                data: data.xData,
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: '累计剂次',
                min: 0,
                max: data.ySumMax,
                interval: ySumInterval,
                axisLabel: {
                    formatter: '{value} 万'
                }
            },
            {
                type: 'value',
                name: '每日增量',
                min: 0,
                max: data.yIncrementMax,
                interval: yIncrementInterval,
                axisLabel: {
                    formatter: '{value} 万'
                }
            }
        ],
        series: [
            {
                name: '累计剂次',
                type: 'line',
                data: data.ySumData,
                color: ['#4682B4'],
                smooth: true,
            },
            {
                name: '每日增量',
                type: 'line',
                yAxisIndex: 1,
                data: data.yIncrementData,
                color: ['#D2691E'],
                smooth: true,
            }
        ]
    };


    useEffect(() => {
        fetch('data.json').then(
            res => {
                res.json().then(
                    (json: DayData[]) => {
                        const xData: string[] = json.map(a => a.date);
                        const urls: string[] = json.map(a => a.href);
                        const ySumData = json.map(a => +a.count);
                        const yIncrementData = ySumData.slice(0, 1).concat(ySumData.slice(0, -1)).map(
                            (value, index) => +(ySumData[index] - value).toFixed(1)
                        );
                        const ySumMax = Math.floor(Math.max(...ySumData) / ySumInterval + 1) * ySumInterval;
                        const yIncrementMax = Math.floor(Math.max(...yIncrementData) / yIncrementInterval + 1) * yIncrementInterval;
                        setData({
                            xData,
                            ySumData,
                            yIncrementData,
                            ySumMax,
                            yIncrementMax,
                            urls
                        })
                    }
                )
            }
        )
    }, [])

    const winSize = useWinSize();
    const {width, height} = winSize;

    function dblclick(params: any) {
        const {dataIndex} = params;
        const url = data.urls[dataIndex];
        window.open(url, "_blank")
    }

    const onEvents = {
        'dblclick': dblclick
    }

    return (
        <div className="App main">
            <ReactECharts
                option={option}
                opts={{
                    renderer: 'svg',
                    width: width-50,
                    height: height-50
                }}
                onEvents={onEvents}
            />
        </div>

    );
}

export default App;
