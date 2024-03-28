import { Component } from 'react'
import { Chess, ChessImageType, chesses, getBorderColor, getChessImage } from './model/Chess'
import { Descriptions, Popover } from 'antd'
import { JobType, RaceType } from '@/api/tft/type'

interface Props {
  race: RaceType
  job: JobType
  width: number
  height: number
  backgroundColor: string
}

export default class RaceJobChessItem extends Component<Props> {
  render () {
    const { race, job, width, height, backgroundColor } = this.props
    const matchedChesses = chesses.filter((chess) => {
      return chess.races.findIndex((e) => e.id === race.id) !== -1 && chess.jobs.findIndex((e) => e.id === job.id) !== -1
    })
    return (
      <div style={{ display: 'flex', flexDirection: 'row', width, height, backgroundColor, margin: 0.5, alignItems: 'center', justifyContent: 'center' }}>
        {matchedChesses.map((chess, index) => {
          const borderColor = getBorderColor(chess.price)
          const marginLeft = index === 0 ? 0 : 4
          return (
            <Popover
              content={this.renderChessCard(chess)}
              overlayInnerStyle={{ padding: 0 }}
              // trigger={'click'}
            >
              <img
                src={getChessImage(chess.imageId, ChessImageType.head)}
                width={34}
                height={34}
                style={{ borderRadius: 18, borderWidth: 2, borderColor, borderStyle: 'solid', marginLeft }}
              />
            </Popover>
          )
        })}
      </div>
    )
  }

  private renderChessCard (chess: Chess) {
    const imageWidth = 360
    const raceJobs: RaceJob[] = []
    for (const info of chess.races) {
      const race = races.find((race) => race.id === info.id)
      if (race) {
        raceJobs.push(race)
      }
    }
    for (const info of chess.jobs) {
      const job = jobs.find((job) => job.id === info.id)
      if (job) {
        raceJobs.push(job)
      }
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 8, width: imageWidth }}>
        <div style={{ position: 'relative', width: imageWidth, aspectRatio: 624 / 318 }}>
          <img
            src={getChessImage(chess.imageId, ChessImageType.full)}
            style={{ position: 'absolute', width: imageWidth, aspectRatio: 624 / 318, borderTopLeftRadius: 8, borderTopRightRadius: 8 }}
          />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, background: 'linear-gradient(#0000, #000A)'}}></div>
          <div style={{ position: 'absolute', left: 20, bottom: 16, display: 'flex', flexDirection: 'column' }}>
            {raceJobs.map((raceJob) => {

              return (
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <img
                    className={'white_icon'}
                    src={raceJob.iconUrl}
                    style={{ width: 16, height: 16, marginRight: 4 }}
                  />
                  <span style={{ fontSize: 15, color: 'white' }}>{raceJob.name}</span>
                </div>
              )
            })}
            <span style={{ fontSize: 20, fontWeight: 'bold', color: 'white', marginTop: 8 }}>{chess.name}</span>
          </div>
        </div>
        <Descriptions
          layout={'vertical'}
          column={3}
          bordered
          size={'small'}
          style={{ margin: 16, width: imageWidth - 32 }}
          labelStyle={{ fontSize: 12, fontWeight: 'bold', color: '#9E9E9E', textAlign: 'center' }}
          contentStyle={{ fontSize: 13, color: '#212121'}}
          items={[
            { label: '生命', children: chess.life.value },
            { label: '护甲', children: chess.life.armor },
            { label: '魔抗', children: chess.life.spellBlock },
            { label: '攻击', children: chess.attack.value },
            { label: '攻速', children: chess.attack.speed },
            { label: '暴击', children: chess.critRate },
            { label: '攻击距离', children: chess.attack.range },
            { label: '初始法力值', children: chess.skill.startMagic || '0' },
            { label: '最大法力值', children: chess.skill.magic || '0' }
          ]}
        />
        <div style={{ display: 'flex', flexDirection: 'column', paddingLeft: 16, paddingRight: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <img
              src={chess.skill.iconUrl}
              style={{ width: 24, height: 24, marginRight: 8 }}
            />
            <span style={{ fontSize: 20, fontWeight: 'bold', color: '#212121' }}>{chess.skill.name}</span>
          </div>
          <span style={{ fontSize: 13, color: '#212121' }}>{chess.skill.detail}</span>
        </div>
      </div>
    )
  }
}
