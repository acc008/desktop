import * as React from 'react'
import { FileChange } from '../../models/status'
import { Octicon, OcticonSymbol } from '../octicons'
import { RichText } from '../lib/rich-text'
import { LinkButton } from '../lib/link-button'
import { IGitHubUser } from '../../lib/dispatcher'
import { Repository } from '../../models/repository'
import { CommitIdentity } from '../../models/commit-identity'
import { Avatar } from '../lib/avatar'

interface ICommitSummaryProps {
  readonly repository: Repository
  readonly summary: string
  readonly body: string
  readonly sha: string
  readonly author: CommitIdentity
  readonly files: ReadonlyArray<FileChange>
  readonly emoji: Map<string, string>
  readonly isLocal: boolean
  readonly gitHubUser: IGitHubUser | null
  readonly isExpanded: boolean
  readonly onExpandChanged: (isExpanded: boolean) => void
}

interface ICommitSummaryState {
  readonly isOverflowed: boolean
}

export class CommitSummary extends React.Component<ICommitSummaryProps, ICommitSummaryState> {
  private commitSummaryDescriptionDiv: HTMLDivElement | null

  public constructor(props: ICommitSummaryProps) {
    super(props)

    this.state = { isOverflowed: false }
  }

  private commitSummaryDescriptionRef = (ref: HTMLDivElement | null) => {
    this.commitSummaryDescriptionDiv = ref
  }

  private renderExpander() {
    if (!this.props.body.length) {
      return null
    }

    if (!this.props.isExpanded && this.state.isOverflowed) {
      return (
        <a
          onClick={this.onExpand}
          className='expander'
        >
          <Octicon symbol={OcticonSymbol.unfold} />
          Expand
        </a>
      )
    }

    if (this.props.isExpanded) {
      return (
        <a
          onClick={this.onCollapse}
          className='expander'
        >
          <Octicon symbol={OcticonSymbol.fold} />
          Collapse
        </a>
      )
    }

    return null
  }

  private onExpand = () => {
    this.props.onExpandChanged(true)
  }

  private onCollapse = () => {
    if (this.commitSummaryDescriptionDiv) {
      this.commitSummaryDescriptionDiv.scrollTop = 0
    }

    this.props.onExpandChanged(false)
  }

  private updateOverflow() {
    const div = this.commitSummaryDescriptionDiv

    if (!div) {
      return
    }

    const doesOverflow = div.scrollHeight > div.offsetHeight

    this.setState({
      isOverflowed: doesOverflow,
    })
  }

  public componentDidMount() {
    this.updateOverflow()
  }

  public componentDidUpdate(prevProps: ICommitSummaryProps) {
    if (prevProps.body !== this.props.body) {
      this.updateOverflow()
    }
  }

  public render() {
    const fileCount = this.props.files.length
    const filesPlural = fileCount === 1 ? 'file' : 'files'
    const filesDescription = `${fileCount} changed ${filesPlural}`
    const shortSHA = this.props.sha.slice(0, 7)

    let url: string | null = null
    if (!this.props.isLocal) {
      const gitHubRepository = this.props.repository.gitHubRepository
      if (gitHubRepository) {
        url = `${gitHubRepository.htmlURL}/commit/${this.props.sha}`
      }
    }

    const author = this.props.author
    const authorTitle = `${author.name} <${author.email}>`
    let avatarUser = undefined
    if (this.props.gitHubUser) {
      avatarUser = { ...author, avatarURL: this.props.gitHubUser.avatarURL }
    }

    const className = this.props.isExpanded
      ? 'expanded'
      : 'collapsed'

    return (
      <div id='commit-summary' className={className}>
        <div className='commit-summary-header'>
          <RichText
            className='commit-summary-title'
            emoji={this.props.emoji}
            repository={this.props.repository}
            text={this.props.summary} />

          <ul className='commit-summary-meta'>
            <li className='commit-summary-meta-item'
              title={authorTitle} aria-label='Author'>
              <span aria-hidden='true'>
                <Avatar user={avatarUser} />
              </span>

              {author.name}
            </li>

            <li className='commit-summary-meta-item'
              title={shortSHA} aria-label='SHA'>
              <span aria-hidden='true'>
                <Octicon symbol={OcticonSymbol.gitCommit} />
              </span>

              {url ? <LinkButton uri={url}>{shortSHA}</LinkButton> : shortSHA}
            </li>

            <li className='commit-summary-meta-item'
              title={filesDescription}>
              <span aria-hidden='true'>
                <Octicon symbol={OcticonSymbol.diff} />
              </span>

              {filesDescription}
            </li>
          </ul>
        </div>

        <div className='commit-summary-description-container'>
          <RichText
            className='commit-summary-description'
            emoji={this.props.emoji}
            repository={this.props.repository}
            text={this.props.body}
            onContainerRef={this.commitSummaryDescriptionRef} />

          {this.renderExpander()}
        </div>
      </div>
    )
  }
}
